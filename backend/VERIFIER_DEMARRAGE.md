# 🔍 Vérification du Démarrage du Backend

## Problème : Erreurs 404 sur toutes les routes

Si vous voyez des erreurs 404 sur `/api/courses`, `/api/tps`, `/api/exams`, `/api/upload/pdf`, cela signifie que **le backend ne démarre probablement pas correctement**.

## ✅ Solution : Installer multer

Multer est nécessaire pour l'upload de fichiers mais n'est peut-être pas installé.

### Étape 1 : Installer multer

```bash
cd backend
npm install multer
```

### Étape 2 : Vérifier que le backend démarre

```bash
cd backend
npm start
```

**Vous devriez voir :**
```
✓ Connexion réussie à MongoDB
✓ Serveur démarré sur le port 5000
```

**Si vous voyez une erreur :**
- Copiez le message d'erreur
- Vérifiez que toutes les dépendances sont installées

### Étape 3 : Vérifier que les routes sont accessibles

Ouvrez votre navigateur et allez sur :
```
http://localhost:5000
```

Vous devriez voir :
```json
{
  "success": true,
  "message": "API Système de Gestion Académique",
  "version": "1.0.0"
}
```

## 🐛 Si le backend ne démarre toujours pas

### Vérifier les dépendances

```bash
cd backend
npm install
```

### Vérifier les erreurs

Regardez le message d'erreur dans le terminal. Les erreurs communes sont :

1. **"Cannot find module 'multer'"**
   - Solution : `npm install multer`

2. **"Cannot find module '...'"**
   - Solution : `npm install`

3. **Erreur de connexion MongoDB**
   - Vérifiez que MongoDB est démarré
   - Vérifiez `backend/.env` : `MONGO_URI=...`

4. **Port déjà utilisé**
   - Changez le port dans `backend/.env` : `PORT=5001`
   - Ou arrêtez l'application qui utilise le port 5000

## ✅ Après installation de multer

1. **Redémarrez le backend**
2. **Vérifiez qu'il démarre sans erreur**
3. **Testez la création d'un cours**

Les erreurs 404 devraient disparaître !

