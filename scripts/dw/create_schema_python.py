
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def create_schema():
    """Créer le schéma du Data Warehouse"""
    
    # Connexion à PostgreSQL
    try:
        conn = psycopg2.connect(
            host=os.getenv('PG_HOST', 'localhost'),
            port=os.getenv('PG_PORT', '5432'),
            database=os.getenv('PG_DB', 'datawarehouse'),
            user=os.getenv('PG_USER', 'postgres'),
            password=os.getenv('PG_PASSWORD', 'root')
        )
        print("[OK] Connexion PostgreSQL reussie")
        
        # Lire le fichier SQL
        sql_file = os.path.join(os.path.dirname(__file__), 'create_dw_schema.sql')
        print(f"[INFO] Lecture du fichier : {sql_file}")
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Utiliser autocommit pour exécuter le script complet
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print(f"[INFO] Execution du script SQL...")
        
        # Exécuter le SQL complet
        try:
            cursor.execute(sql_content)
            print(f"[OK] Script SQL execute avec succes")
        except Exception as e:
            error_msg = str(e)
            # Les erreurs "already exists" sont normales si le schéma existe déjà
            if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
                print(f"[INFO] Certains objets existent deja (normal si re-execution)")
            else:
                print(f"[WARN] Erreur : {error_msg[:200]}")
                # Essayer quand même de continuer
        
        # Vérifier les tables créées
        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print(f"\n[INFO] Tables creees : {len(tables)}")
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"   - {table[0]} : {count} lignes")
            except:
                pass
        
        cursor.close()
        conn.close()
        print("\n[OK] Schema cree avec succes !")
        
    except psycopg2.OperationalError as e:
        print(f"[ERREUR] Erreur de connexion PostgreSQL : {e}")
        print("\nVerifiez :")
        print("  - PostgreSQL est demarre")
        print("  - La base de donnees 'datawarehouse' existe")
        print("  - Les identifiants dans .env sont corrects")
    except FileNotFoundError:
        print(f"[ERREUR] Fichier SQL non trouve : {sql_file}")
    except Exception as e:
        print(f"[ERREUR] Erreur : {e}")

if __name__ == "__main__":
    print("="*60)
    print("CRÉATION DU SCHÉMA DATA WAREHOUSE")
    print("="*60)
    create_schema()

