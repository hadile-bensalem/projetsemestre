"""
Script pour diagnostiquer pourquoi certaines soumissions ne sont pas chargées dans le DW
"""

import pymongo
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
MONGO_DB = os.getenv('MONGO_DB', 'votre_db')
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_PORT = os.getenv('PG_PORT', '5432')
PG_DB = os.getenv('PG_DB', 'datawarehouse')
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')

print("="*60)
print("DIAGNOSTIC ETL - POURQUOI CERTAINES SOUMISSIONS SONT IGNOREES")
print("="*60)

mongo_client = pymongo.MongoClient(MONGO_URI)
mongo_db = mongo_client[MONGO_DB]

# Récupérer toutes les soumissions
submissions = list(mongo_db.examsubmissions.find({'isSubmitted': True}))
print(f"\nTotal soumissions dans MongoDB: {len(submissions)}")

pg_conn = psycopg2.connect(
    host=PG_HOST,
    port=PG_PORT,
    database=PG_DB,
    user=PG_USER,
    password=PG_PASSWORD
)
cursor = pg_conn.cursor()

for sub in submissions:
    exam_id = str(sub.get('exam'))
    student_id = str(sub.get('student'))
    passed = sub.get('passed', False)
    percentage = sub.get('percentage', 0)
    
    print(f"\n{'='*60}")
    print(f"Soumission ID: {sub['_id']}")
    print(f"  - Exam ID: {exam_id}")
    print(f"  - Student ID: {student_id}")
    print(f"  - Passed: {passed}")
    print(f"  - Percentage: {percentage}%")
    
    # Vérifier si l'examen existe dans le DW
    cursor.execute("SELECT exam_key, title FROM dim_exam WHERE exam_id = %s", (exam_id,))
    exam_dw = cursor.fetchone()
    
    if exam_dw:
        print(f"  - [OK] Examen trouvé dans DW: {exam_dw[1]}")
    else:
        print(f"  - [ERREUR] Examen NON trouvé dans DW!")
        # Vérifier dans MongoDB
        exam_mongo = mongo_db.exams.find_one({'_id': sub.get('exam')})
        if exam_mongo:
            print(f"    Examen existe dans MongoDB: {exam_mongo.get('title', 'N/A')}")
        else:
            print(f"    Examen n'existe même pas dans MongoDB!")
    
    # Vérifier si l'étudiant existe dans le DW
    cursor.execute("SELECT student_key, full_name FROM dim_student WHERE student_id = %s", (student_id,))
    student_dw = cursor.fetchone()
    
    if student_dw:
        print(f"  - [OK] Étudiant trouvé dans DW: {student_dw[1]}")
    else:
        print(f"  - [ERREUR] Étudiant NON trouvé dans DW!")
        # Vérifier dans MongoDB
        student_mongo = mongo_db.users.find_one({'_id': sub.get('student')})
        if student_mongo:
            print(f"    Étudiant existe dans MongoDB: {student_mongo.get('username', 'N/A')}")
        else:
            print(f"    Étudiant n'existe même pas dans MongoDB!")
    
    # Vérifier la filière de l'étudiant
    student_mongo = mongo_db.users.find_one({'_id': sub.get('student')})
    if student_mongo:
        student_info = student_mongo.get('studentInfo', {})
        filiere_ref = student_info.get('filiere')
        
        if filiere_ref:
            if isinstance(filiere_ref, dict):
                filiere_id = str(filiere_ref.get('_id', ''))
            else:
                filiere_id = str(filiere_ref)
            
            cursor.execute("SELECT filiere_key, name FROM dim_filiere WHERE filiere_id = %s", (filiere_id,))
            filiere_dw = cursor.fetchone()
            
            if filiere_dw:
                print(f"  - [OK] Filière trouvée dans DW: {filiere_dw[1]}")
            else:
                print(f"  - [ERREUR] Filière NON trouvée dans DW! (ID: {filiere_id})")
        else:
            print(f"  - [ERREUR] Étudiant n'a pas de filière assignée!")
    
    # Vérifier si la soumission existe dans le DW
    if exam_dw and student_dw:
        cursor.execute("""
            SELECT fact_id, percentage, passed 
            FROM fact_exam_results 
            WHERE exam_key = %s AND student_key = %s
        """, (exam_dw[0], student_dw[0]))
        fact_dw = cursor.fetchone()
        
        if fact_dw:
            print(f"  - [OK] Soumission trouvée dans DW (Fact ID: {fact_dw[0]})")
            print(f"    Passed dans DW: {fact_dw[2]}, Percentage: {fact_dw[1]}%")
        else:
            print(f"  - [ERREUR] Soumission NON trouvée dans DW!")
            print(f"    Raison probable: Filière manquante ou problème de transformation")

cursor.close()
pg_conn.close()
mongo_client.close()

print("\n" + "="*60)
print("DIAGNOSTIC TERMINE")
print("="*60)

