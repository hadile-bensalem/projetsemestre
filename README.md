# Projet Semestre - Plateforme Éducative avec Business Intelligence

Plateforme éducative complète développée avec la stack MERN (MongoDB, Express, React, Node.js) intégrant un système de Business Intelligence (BI) avec Power BI.

## 🎯 Fonctionnalités

### Application MERN
- **Authentification** : Système de connexion pour étudiants, enseignants et administrateurs
- **Gestion des examens** : Création, passage et correction d'examens
- **Gestion des cours** : Création et gestion de cours par les enseignants
- **Gestion des TP** : Création et gestion de travaux pratiques
- **Suivi des résultats** : Visualisation des résultats d'examens pour les enseignants
- **Certificats** : Génération automatique de certificats pour les examens réussis

### Business Intelligence (BI)
- **ETL** : Processus d'extraction, transformation et chargement des données
- **Data Warehouse** : Entrepôt de données PostgreSQL avec schéma en étoile
- **Power BI** : Dashboards interactifs intégrés dans l'application
- **Analytics** : Analyse des performances des examens, étudiants et filières

## 🏗️ Architecture

```
projetsemestre/
├── backend/              # API Express/Node.js
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Routes API
│   ├── middleware/      # Middleware d'authentification
│   └── utils/           # Utilitaires (génération de certificats)
├── frontend/eduplatforme/ # Application React
│   └── src/
│       ├── components/   # Composants React
│       ├── services/     # Services API
│       └── context/      # Context API
└── scripts/             # Scripts BI
    ├── etl/             # Scripts ETL Python
    └── dw/              # Scripts Data Warehouse SQL
```

## 🚀 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB
- PostgreSQL
- Python 3.8+ (pour les scripts ETL)
- Power BI Desktop (pour les dashboards)

### Installation Backend

```bash
cd backend
npm install
```

### Installation Frontend

```bash
cd frontend/eduplatforme
npm install
```

### Configuration

1. **Backend** : Créez un fichier `.env` dans `backend/` :
```env
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=projetsemestre
JWT_SECRET=votre_secret_jwt
PORT=5000
```

2. **Frontend** : Créez un fichier `.env` dans `frontend/eduplatforme/` :
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. **ETL/BI** : Créez un fichier `.env` à la racine :
```env
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=projetsemestre
PG_HOST=localhost
PG_PORT=5432
PG_DB=datawarehouse
PG_USER=postgres
PG_PASSWORD=votre_mot_de_passe
```

## 📊 Configuration du Business Intelligence

### 1. Créer le Data Warehouse

```bash
# Installer les dépendances Python
pip install -r scripts/etl/requirements.txt

# Créer le schéma PostgreSQL
python scripts/dw/create_schema_python.py
```

### 2. Exécuter l'ETL

```bash
# Tester les connexions
python scripts/etl/test_connections.py

# Exécuter l'ETL
python scripts/etl/etl_mongodb_to_dw.py
```

### 3. Configurer Power BI

1. Ouvrez Power BI Desktop
2. Connectez-vous à PostgreSQL
3. Importez les tables du Data Warehouse
4. Créez vos visualisations et mesures DAX
5. Publiez sur Power BI Service
6. Intégrez l'URL d'embed dans `frontend/eduplatforme/src/components/Teacher/BIDashboard.jsx`

## 🎮 Utilisation

### Démarrer le Backend

```bash
cd backend
npm start
```

### Démarrer le Frontend

```bash
cd frontend/eduplatforme
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du Data Warehouse

### Tables de Dimensions
- `dim_exam` : Informations sur les examens
- `dim_student` : Informations sur les étudiants
- `dim_filiere` : Informations sur les filières
- `dim_date` : Dimension temporelle (calendrier)

### Table de Faits
- `fact_exam_results` : Résultats des examens avec métriques (score, pourcentage, statut de réussite)

### Vues Analytiques
- `vw_exam_summary` : Résumé par examen
- `vw_filiere_performance` : Performance par filière
- `vw_student_performance` : Performance par étudiant

## 🔧 Scripts Utiles

### Vérifier les données ETL
```bash
python scripts/etl/verifier_donnees_etl.py
```

### Diagnostiquer les problèmes ETL
```bash
python scripts/etl/diagnostic_etl.py
```

## 📝 Technologies Utilisées

- **Backend** : Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend** : React, React Router, Tailwind CSS, Axios
- **BI** : PostgreSQL, Python (pymongo, psycopg2), Power BI, DAX
- **ETL** : Python, pandas, SQLAlchemy

## 👥 Rôles

- **Administrateur** : Gestion complète de la plateforme
- **Enseignant** : Création d'examens, cours, TP et visualisation des résultats
- **Étudiant** : Passage d'examens, visualisation des résultats

## 📄 Licence

Ce projet est développé dans le cadre d'un projet académique.

## 🤝 Contribution

Ce projet est un projet académique. Pour toute question ou suggestion, veuillez ouvrir une issue.

---

**Développé avec ❤️ pour l'analyse de données éducatives**

