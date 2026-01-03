"""
Script de test pour vérifier les connexions MongoDB et PostgreSQL
Utilisez ce script avant d'exécuter l'ETL pour vérifier que tout est configuré correctement
"""

import pymongo
import psycopg2
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

print("="*60)
print("TEST DE CONNEXION - MongoDB et PostgreSQL")
print("="*60)

# Variables pour le résumé final
exams_count = 0
tables = []

# Test MongoDB
print("\n[1] Test de connexion MongoDB...")
try:
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    mongo_db = os.getenv('MONGO_DB', 'votre_db')
    
    client = pymongo.MongoClient(mongo_uri)
    db = client[mongo_db]
    
    # Tests
    exams_count = db.exams.count_documents({})
    submissions_count = db.examsubmissions.count_documents({'isSubmitted': True})
    students_count = db.users.count_documents({'role': 'student'})
    filieres_count = db.filieres.count_documents({})
    
    print(f"[OK] MongoDB : Connexion reussie")
    print(f"   Base de donnees : {mongo_db}")
    print(f"   [INFO] Examens : {exams_count}")
    print(f"   [INFO] Soumissions : {submissions_count}")
    print(f"   [INFO] Etudiants : {students_count}")
    print(f"   [INFO] Filieres : {filieres_count}")
    
    if exams_count == 0:
        print("   [WARN] Aucun examen trouve - Verifiez votre base de donnees")
    if submissions_count == 0:
        print("   [WARN] Aucune soumission trouvee - Verifiez vos donnees")
    
    client.close()
    
except Exception as e:
    print(f"[ERREUR] Erreur MongoDB : {e}")
    print("   Verifiez :")
    print("   - MongoDB est demarre")
    print("   - MONGO_URI dans .env")
    print("   - MONGO_DB dans .env")
    exams_count = 0

# Test PostgreSQL
print("\n[2] Test de connexion PostgreSQL...")
try:
    pg_host = os.getenv('PG_HOST', 'localhost')
    pg_port = os.getenv('PG_PORT', '5432')
    pg_db = os.getenv('PG_DB', 'datawarehouse')
    pg_user = os.getenv('PG_USER', 'postgres')
    pg_password = os.getenv('PG_PASSWORD', 'password')
    
    conn = psycopg2.connect(
        host=pg_host,
        port=pg_port,
        database=pg_db,
        user=pg_user,
        password=pg_password
    )
    
    cursor = conn.cursor()
    
    # Vérifier si les tables existent
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    
    print(f"[OK] PostgreSQL : Connexion reussie")
    print(f"   Base de donnees : {pg_db}")
    print(f"   [INFO] Tables trouvees : {len(tables)}")
    
    if len(tables) > 0:
        print("   Tables existantes :")
        for table in tables:
            # Compter les lignes
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"      - {table[0]} : {count} lignes")
    else:
        print("   [WARN] Aucune table trouvee")
        print("   -> Executez d'abord : scripts/dw/create_dw_schema.sql")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"[ERREUR] Erreur de connexion PostgreSQL : {e}")
    print("   Verifiez :")
    print("   - PostgreSQL est demarre")
    print("   - Les variables PG_* dans .env")
    print("   - La base de donnees existe : CREATE DATABASE datawarehouse;")
    tables = []
except Exception as e:
    print(f"[ERREUR] Erreur PostgreSQL : {e}")
    tables = []

print("\n" + "="*60)
print("TEST TERMINÉ")
print("="*60)

if exams_count > 0 and len(tables) > 0:
    print("\n[OK] Tout est pret ! Vous pouvez executer l'ETL :")
    print("   python scripts/etl/etl_mongodb_to_dw.py")
else:
    print("\n[WARN] Verifiez les erreurs ci-dessus avant de continuer")

