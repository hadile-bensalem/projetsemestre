# Scripts ETL - MongoDB vers Data Warehouse

## Prérequis

### 1. Python 3.8+

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

Les dépendances nécessaires :
- `pymongo` - Connexion MongoDB
- `psycopg2` ou `psycopg2-binary` - Connexion PostgreSQL
- `pandas` - Manipulation de données
- `sqlalchemy` - ORM (optionnel)
- `python-dotenv` - Gestion des variables d'environnement

### 3. Configuration

Créer un fichier `.env` à la racine du projet :

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=votre_db

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DB=datawarehouse
PG_USER=postgres
PG_PASSWORD=votre_password
```

## Utilisation

### 1. Créer le schéma du Data Warehouse

```bash
# Se connecter à PostgreSQL
psql -U postgres -d datawarehouse

# Exécuter le script SQL
\i scripts/dw/create_dw_schema.sql
```

### 2. Exécuter le processus ETL

```bash
cd scripts/etl
python etl_mongodb_to_dw.py
```

## Structure des fichiers

```
scripts/
├── dw/
│   └── create_dw_schema.sql    # Schéma du Data Warehouse
└── etl/
    ├── README.md                # Ce fichier
    ├── etl_mongodb_to_dw.py    # Script ETL principal
    └── requirements.txt         # Dépendances Python
```

## Notes

- Le script utilise `ON CONFLICT` pour éviter les doublons
- Les dates sont automatiquement créées dans `dim_date`
- Les transformations incluent le nettoyage et la normalisation des données

