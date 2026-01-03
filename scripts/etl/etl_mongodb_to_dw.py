"""
Script ETL pour extraire les données de MongoDB et les charger dans le Data Warehouse PostgreSQL
Auteur: Votre nom
Date: 2024
"""

import pymongo
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# ============================================
# CONFIGURATION
# ============================================

# MongoDB
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
MONGO_DB = os.getenv('MONGO_DB', 'votre_db')

# PostgreSQL
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_PORT = os.getenv('PG_PORT', '5432')
PG_DB = os.getenv('PG_DB', 'datawarehouse')
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')

# ============================================
# CONNEXIONS
# ============================================

def get_mongo_connection():
    """Établir la connexion à MongoDB"""
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        print(f"Connexion MongoDB réussie : {MONGO_DB}")
        return db
    except Exception as e:
        print(f" Erreur de connexion MongoDB : {e}")
        raise

def get_postgres_connection():
    """Établir la connexion à PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            database=PG_DB,
            user=PG_USER,
            password=PG_PASSWORD
        )
        print(f"Connexion PostgreSQL réussie : {PG_DB}")
        return conn
    except Exception as e:
        print(f" Erreur de connexion PostgreSQL : {e}")
        raise

# ============================================
# EXTRACTION (EXTRACT)
# ============================================

def extract_exams(db):
    """Extraire les examens depuis MongoDB"""
    print("\n Extraction des examens...")
    exams = list(db.exams.find({}))
    print(f"  {len(exams)} examens extraits")
    return exams

def extract_submissions(db):
    """Extraire les soumissions depuis MongoDB"""
    print("\n Extraction des soumissions...")
    submissions = list(db.examsubmissions.find({'isSubmitted': True}))
    print(f" {len(submissions)} soumissions extraites")
    return submissions

def extract_students(db):
    """Extraire les étudiants depuis MongoDB"""
    print("\n Extraction des étudiants...")
    students = list(db.users.find({'role': 'student'}))
    print(f"    {len(students)} étudiants extraits")
    return students

def extract_filieres(db):
    """Extraire les filières depuis MongoDB"""
    print("\n Extraction des filières...")
    filieres = list(db.filieres.find({}))
    print(f"    {len(filieres)} filières extraites")
    return filieres

# ============================================
# TRANSFORMATION (TRANSFORM)
# ============================================

def transform_exams(exams):
    """Transformer les données d'examens"""
    print("\n Transformation des examens...")
    transformed = []
    
    for exam in exams:
        transformed.append({
            'exam_id': str(exam['_id']),
            'title': exam.get('title', '').strip(),
            'description': exam.get('description', ''),
            'total_points': float(exam.get('totalPoints', 0)),
            'min_passing_score': float(exam.get('minPassingScore', 50)),
            'duration': int(exam.get('duration', 0)),
            'is_published': bool(exam.get('isPublished', False)),
            'published_date': exam.get('publishedAt') if exam.get('publishedAt') else None,
            'created_date': exam.get('createdAt') if exam.get('createdAt') else datetime.now(),
            'updated_date': exam.get('updatedAt') if exam.get('updatedAt') else None
        })
    
    print(f"    {len(transformed)} examens transformés")
    return transformed

def transform_students(students):
    """Transformer les données d'étudiants"""
    print("\n Transformation des étudiants...")
    transformed = []
    
    for student in students:
        student_info = student.get('studentInfo', {})
        first_name = student_info.get('firstName', '')
        last_name = student_info.get('lastName', '')
        full_name = f"{first_name} {last_name}".strip() if first_name or last_name else student.get('username', '')
        
        transformed.append({
            'student_id': str(student['_id']),
            'username': student.get('username', '').strip(),
            'email': student.get('email', '').strip().lower(),
            'first_name': first_name.strip() if first_name else None,
            'last_name': last_name.strip() if last_name else None,
            'full_name': full_name,
            'enrollment_date': student_info.get('enrollmentDate') if student_info.get('enrollmentDate') else None,
            'student_number': student_info.get('studentNumber') if student_info.get('studentNumber') else None
        })
    
    print(f"   [OK] {len(transformed)} etudiants transformes")
    return transformed

def transform_filieres(filieres):
    """Transformer les données de filières"""
    print("\n[TRANSFORM] Transformation des filieres...")
    transformed = []
    
    for filiere in filieres:
        transformed.append({
            'filiere_id': str(filiere['_id']),
            'name': filiere.get('name', '').strip(),
            'code': filiere.get('code', '').strip().upper(),
            'description': filiere.get('description', ''),
            'duration': int(filiere.get('duration', 0)) if filiere.get('duration') else None
        })
    
    print(f"   [OK] {len(transformed)} filieres transformees")
    return transformed

def transform_submissions(submissions, exams_dict, students_dict, filieres_dict):
    """Transformer les soumissions en faits"""
    print("\n[TRANSFORM] Transformation des soumissions...")
    facts = []
    
    for sub in submissions:
        exam_id = str(sub.get('exam'))
        student_id = str(sub.get('student'))
        
        # Récupérer les clés de référence
        exam_data = exams_dict.get(exam_id)
        student_data = students_dict.get(student_id)
        
        if not exam_data or not student_data:
            continue  # Ignorer si les références sont manquantes
        
        # Récupérer la filière de l'étudiant
        student_mongo = students_dict.get(student_id, {}).get('_mongo_data', {})
        student_info = student_mongo.get('studentInfo', {})
        filiere_ref = student_info.get('filiere')
        
        filiere_id = None
        if filiere_ref:
            if isinstance(filiere_ref, dict):
                filiere_id = str(filiere_ref.get('_id', ''))
            else:
                filiere_id = str(filiere_ref)
        
        filiere_key = filieres_dict.get(filiere_id, {}).get('filiere_key')
        
        if not filiere_key:
            continue  # Ignorer si la filière est manquante
        
        # Calculer le temps pris (en minutes)
        started_at = sub.get('startedAt')
        submitted_at = sub.get('submittedAt')
        time_taken_minutes = None
        
        if started_at and submitted_at:
            if isinstance(started_at, str):
                started_at = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
            if isinstance(submitted_at, str):
                submitted_at = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
            
            time_diff = submitted_at - started_at
            time_taken_minutes = int(time_diff.total_seconds() / 60)
        
        # Calculer le pourcentage si manquant
        percentage = float(sub.get('percentage', 0))
        if percentage == 0 and sub.get('totalPoints', 0) > 0:
            percentage = (float(sub.get('score', 0)) / float(sub.get('totalPoints', 1))) * 100
        
        # Date de soumission pour la dimension date
        submission_date = submitted_at if submitted_at else datetime.now()
        if isinstance(submission_date, str):
            submission_date = datetime.fromisoformat(submission_date.replace('Z', '+00:00'))
        
        date_key = int(submission_date.strftime('%Y%m%d'))
        
        facts.append({
            'exam_key': exam_data['exam_key'],
            'student_key': student_data['student_key'],
            'filiere_key': filiere_key,
            'date_key': date_key,
            'score': float(sub.get('score', 0)),
            'total_points': float(sub.get('totalPoints', 0)),
            'percentage': percentage,
            'passed': bool(sub.get('passed', False)),
            'duration_minutes': int(exam_data.get('duration', 0)),
            'time_taken_minutes': time_taken_minutes,
            'certificate_generated': bool(sub.get('certificateGenerated', False)),
            'created_at': sub.get('createdAt', datetime.now()),
            'submitted_at': submitted_at if submitted_at else None
        })
    
    print(f"   [OK] {len(facts)} faits transformes")
    return facts

# ============================================
# CHARGEMENT (LOAD)
# ============================================

def load_dimensions(conn, exams, students, filieres):
    """Charger les dimensions dans le DW"""
    cursor = conn.cursor()
    
    # Charger dim_exam
    print("\n[LOAD] Chargement de dim_exam...")
    for exam in exams:
        cursor.execute("""
            INSERT INTO dim_exam (
                exam_id, title, description, total_points, min_passing_score,
                duration, is_published, published_date, created_date, updated_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (exam_id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                total_points = EXCLUDED.total_points,
                min_passing_score = EXCLUDED.min_passing_score,
                duration = EXCLUDED.duration,
                is_published = EXCLUDED.is_published,
                published_date = EXCLUDED.published_date,
                updated_date = EXCLUDED.updated_date
            RETURNING exam_key
        """, (
            exam['exam_id'], exam['title'], exam['description'],
            exam['total_points'], exam['min_passing_score'],
            exam['duration'], exam['is_published'],
            exam['published_date'], exam['created_date'], exam['updated_date']
        ))
        exam_key = cursor.fetchone()[0]
        exam['exam_key'] = exam_key
    
    # Charger dim_student
    print("\n[LOAD] Chargement de dim_student...")
    for student in students:
        cursor.execute("""
            INSERT INTO dim_student (
                student_id, username, email, first_name, last_name,
                full_name, enrollment_date, student_number
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (student_id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                full_name = EXCLUDED.full_name,
                enrollment_date = EXCLUDED.enrollment_date,
                student_number = EXCLUDED.student_number
            RETURNING student_key
        """, (
            student['student_id'], student['username'], student['email'],
            student['first_name'], student['last_name'], student['full_name'],
            student['enrollment_date'], student['student_number']
        ))
        student_key = cursor.fetchone()[0]
        student['student_key'] = student_key
    
    # Charger dim_filiere
    print("\n  Chargement de dim_filiere...")
    filieres_dict = {}
    for filiere in filieres:
        cursor.execute("""
            INSERT INTO dim_filiere (
                filiere_id, name, code, description, duration
            ) VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (filiere_id) DO UPDATE SET
                name = EXCLUDED.name,
                code = EXCLUDED.code,
                description = EXCLUDED.description,
                duration = EXCLUDED.duration
            RETURNING filiere_key
        """, (
            filiere['filiere_id'], filiere['name'], filiere['code'],
            filiere['description'], filiere['duration']
        ))
        filiere_key = cursor.fetchone()[0]
        filiere['filiere_key'] = filiere_key
        filieres_dict[filiere['filiere_id']] = filiere
    
    conn.commit()
    cursor.close()
    
    # Retourner les dictionnaires pour les jointures
    exams_dict = {exam['exam_id']: exam for exam in exams}
    students_dict = {student['student_id']: student for student in students}
    
    return exams_dict, students_dict, filieres_dict

def load_facts(conn, facts):
    """Charger les faits dans le DW"""
    print("\n[LOAD] Chargement de fact_exam_results...")
    cursor = conn.cursor()
    
    # Vérifier que les dates existent dans dim_date
    date_keys = set(fact['date_key'] for fact in facts)
    for date_key in date_keys:
        date_str = str(date_key)
        date_obj = datetime(int(date_str[:4]), int(date_str[4:6]), int(date_str[6:8]))
        cursor.execute("""
            INSERT INTO dim_date (date_key, date, year, quarter, month, month_name, week, day_of_month, day_of_week, day_name, is_weekend, is_month_end, is_quarter_end, is_year_end)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (date_key) DO NOTHING
        """, (
            date_key, date_obj.date(),
            date_obj.year, date_obj.month // 4 + 1, date_obj.month,
            date_obj.strftime('%B'), date_obj.isocalendar()[1],
            date_obj.day, date_obj.weekday() + 1, date_obj.strftime('%A'),
            date_obj.weekday() >= 5, False, False, False
        ))
    
    # Charger les faits
    insert_query = """
        INSERT INTO fact_exam_results (
            exam_key, student_key, filiere_key, date_key,
            score, total_points, percentage, passed,
            duration_minutes, time_taken_minutes, certificate_generated,
            created_at, submitted_at
        ) VALUES %s
        ON CONFLICT DO NOTHING
    """
    
    values = [(
        fact['exam_key'], fact['student_key'], fact['filiere_key'], fact['date_key'],
        fact['score'], fact['total_points'], fact['percentage'], fact['passed'],
        fact['duration_minutes'], fact['time_taken_minutes'], fact['certificate_generated'],
        fact['created_at'], fact['submitted_at']
    ) for fact in facts]
    
    execute_values(cursor, insert_query, values)
    
    conn.commit()
    cursor.close()
    print(f"   [OK] {len(facts)} faits charges")

# ============================================
# FONCTION PRINCIPALE ETL
# ============================================

def run_etl():
    """Exécuter le processus ETL complet"""
    print("\n" + "="*50)
    print("[ETL] DEMARRAGE DU PROCESSUS ETL")
    print("="*50)
    
    # Connexions
    mongo_db = get_mongo_connection()
    pg_conn = get_postgres_connection()
    
    try:
        # EXTRACTION
        exams_raw = extract_exams(mongo_db)
        submissions_raw = extract_submissions(mongo_db)
        students_raw = extract_students(mongo_db)
        filieres_raw = extract_filieres(mongo_db)
        
        # TRANSFORMATION
        exams_transformed = transform_exams(exams_raw)
        students_transformed = transform_students(students_raw)
        filieres_transformed = transform_filieres(filieres_raw)
        
        # CHARGEMENT DES DIMENSIONS
        exams_dict, students_dict, filieres_dict = load_dimensions(
            pg_conn, exams_transformed, students_transformed, filieres_transformed
        )
        
        # Transformer les soumissions (nécessite les clés des dimensions)
        # Créer un mapping des étudiants MongoDB pour récupérer les filières
        students_mongo_dict = {str(s['_id']): s for s in students_raw}
        students_dict_enhanced = {}
        for student_id, student_data in students_dict.items():
            students_dict_enhanced[student_id] = student_data
            students_dict_enhanced[student_id]['_mongo_data'] = students_mongo_dict.get(student_id, {})
        
        facts = transform_submissions(
            submissions_raw, exams_dict, students_dict_enhanced, filieres_dict
        )
        
        # CHARGEMENT DES FAITS
        if facts:
            load_facts(pg_conn, facts)
        
        print("\n" + "="*50)
        print(" PROCESSUS ETL TERMINÉ AVEC SUCCÈS")
        print("="*50)
        
    except Exception as e:
        print(f"\n ERREUR LORS DU PROCESSUS ETL : {e}")
        pg_conn.rollback()
        raise
    finally:
        mongo_db.client.close()
        pg_conn.close()
        print("\n[CLOSE] Connexions fermees")

# ============================================
# EXECUTION
# ============================================

if __name__ == "__main__":
    run_etl()

