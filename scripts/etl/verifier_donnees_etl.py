"""
Script pour vérifier les données dans MongoDB et PostgreSQL
et diagnostiquer le problème du taux d'échec
"""

import pymongo
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Connexions
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
MONGO_DB = os.getenv('MONGO_DB', 'votre_db')
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_PORT = os.getenv('PG_PORT', '5432')
PG_DB = os.getenv('PG_DB', 'datawarehouse')
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')

print("="*60)
print("VERIFICATION DES DONNEES - DIAGNOSTIC TAUX D'ECHEC")
print("="*60)

# MongoDB
print("\n[1] VERIFICATION MONGODB")
print("-"*60)
mongo_client = pymongo.MongoClient(MONGO_URI)
mongo_db = mongo_client[MONGO_DB]

# Vérifier les soumissions
submissions = list(mongo_db.examsubmissions.find({'isSubmitted': True}))
print(f"\nTotal soumissions soumises: {len(submissions)}")

if submissions:
    print("\nDétails des soumissions:")
    for sub in submissions[:10]:  # Afficher les 10 premières
        passed = sub.get('passed', None)
        percentage = sub.get('percentage', 0)
        score = sub.get('score', 0)
        total_points = sub.get('totalPoints', 0)
        
        print(f"  - Submission ID: {sub['_id']}")
        print(f"    Score: {score}/{total_points}")
        print(f"    Pourcentage: {percentage}%")
        print(f"    Passed (type: {type(passed)}, valeur: {passed}): {passed}")
        print(f"    isSubmitted: {sub.get('isSubmitted', False)}")
        print()
    
    # Statistiques
    passed_count = sum(1 for s in submissions if s.get('passed') == True)
    failed_count = sum(1 for s in submissions if s.get('passed') == False)
    null_passed = sum(1 for s in submissions if s.get('passed') is None)
    
    print(f"\nStatistiques MongoDB:")
    print(f"  - Réussis (passed=True): {passed_count}")
    print(f"  - Échoués (passed=False): {failed_count}")
    print(f"  - Passed NULL/Manquant: {null_passed}")
    print(f"  - Taux d'échec: {failed_count}/{len(submissions)} = {failed_count/len(submissions)*100 if len(submissions) > 0 else 0:.2f}%")

# PostgreSQL
print("\n[2] VERIFICATION POSTGRESQL (DATA WAREHOUSE)")
print("-"*60)
pg_conn = psycopg2.connect(
    host=PG_HOST,
    port=PG_PORT,
    database=PG_DB,
    user=PG_USER,
    password=PG_PASSWORD
)
cursor = pg_conn.cursor()

# Vérifier les faits
cursor.execute("""
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN passed = TRUE THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN passed = FALSE THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN passed IS NULL THEN 1 ELSE 0 END) as null_passed
    FROM fact_exam_results
""")
stats = cursor.fetchone()

if stats:
    total, passed_count, failed_count, null_passed = stats
    print(f"\nStatistiques Data Warehouse:")
    print(f"  - Total soumissions: {total}")
    print(f"  - Réussis (passed=TRUE): {passed_count}")
    print(f"  - Échoués (passed=FALSE): {failed_count}")
    print(f"  - Passed NULL: {null_passed}")
    if total > 0:
        print(f"  - Taux d'échec: {failed_count}/{total} = {failed_count/total*100:.2f}%")

# Vérifier quelques exemples
cursor.execute("""
    SELECT 
        f.fact_id,
        f.percentage,
        f.passed,
        f.score,
        f.total_points,
        d.title as exam_title,
        s.full_name as student_name
    FROM fact_exam_results f
    JOIN dim_exam d ON f.exam_key = d.exam_key
    JOIN dim_student s ON f.student_key = s.student_key
    ORDER BY f.fact_id
    LIMIT 10
""")
examples = cursor.fetchall()

if examples:
    print(f"\nExemples de données dans le DW (10 premières):")
    for ex in examples:
        fact_id, percentage, passed, score, total_points, exam_title, student_name = ex
        print(f"  - Fact ID: {fact_id}")
        print(f"    Étudiant: {student_name}")
        print(f"    Examen: {exam_title}")
        print(f"    Score: {score}/{total_points} ({percentage}%)")
        print(f"    Passed (type: {type(passed)}, valeur: {passed}): {passed}")
        print()

# Vérifier spécifiquement les échecs
cursor.execute("""
    SELECT 
        COUNT(*) as failed_count,
        AVG(percentage) as avg_percentage_failed
    FROM fact_exam_results
    WHERE passed = FALSE
""")
failed_stats = cursor.fetchone()

if failed_stats:
    failed_count, avg_percentage = failed_stats
    print(f"\nStatistiques des échecs:")
    print(f"  - Nombre d'échecs: {failed_count}")
    if avg_percentage:
        print(f"  - Pourcentage moyen des échecs: {avg_percentage:.2f}%")

cursor.close()
pg_conn.close()
mongo_client.close()

print("\n" + "="*60)
print("VERIFICATION TERMINEE")
print("="*60)

