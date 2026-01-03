/**
 * Script pour vérifier que le backend peut démarrer correctement
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

console.log('[INFO] Verification du demarrage du backend...\n');

try {
    const app = express();

    // Test des middlewares
    console.log('1. Test des middlewares...');
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    console.log('   [OK] Middlewares configurés\n');

    // Test de la connexion MongoDB
    console.log('2. Test de la connexion MongoDB...');
    connectDB();
    console.log('   [OK] Connexion MongoDB initiée\n');

    // Test du chargement des routes
    console.log('3. Test du chargement des routes...');
    const courseRoutes = require('./routes/courseRoutes');
    const tpRoutes = require('./routes/tpRoutes');
    const examRoutes = require('./routes/examRoutes');
    const uploadRoutes = require('./routes/uploadRoutes');
    console.log('   [OK] Toutes les routes chargées\n');

    // Enregistrement des routes
    console.log('4. Enregistrement des routes...');
    app.use('/api/courses', courseRoutes);
    console.log('   [OK] /api/courses');
    app.use('/api/tps', tpRoutes);
    console.log('   [OK] /api/tps');
    app.use('/api/exams', examRoutes);
    console.log('   [OK] /api/exams');
    app.use('/api/upload', uploadRoutes);
    console.log('   [OK] /api/upload\n');

    // Route de test
    app.get('/', (req, res) => {
        res.json({ success: true, message: 'Backend OK' });
    });

    const PORT = process.env.PORT || 5000;

    // Test du démarrage du serveur
    console.log('5. Test du démarrage du serveur...');
    const server = app.listen(PORT, () => {
        console.log(`   [OK] Serveur demarre sur le port ${PORT}\n`);
        console.log('[OK] Tous les tests sont passes !\n');
        console.log('[INFO] Le backend devrait fonctionner correctement.');
        console.log('[INFO] Pour demarrer le serveur en production :');
        console.log('   cd backend');
        console.log('   npm start\n');
        
        // Fermer le serveur de test
        server.close(() => {
            process.exit(0);
        });
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`   [ERREUR] Le port ${PORT} est déjà utilisé`);
            console.error('   Solution : Arrêtez l\'application qui utilise ce port ou changez le port dans .env');
        } else {
            console.error(`   [ERREUR] Erreur : ${err.message}`);
        }
        process.exit(1);
    });

} catch (error) {
    console.error('[ERREUR] Erreur lors de la verification:', error.message);
    console.error('\n[INFO] Details de l\'erreur:');
    console.error(error.stack);
    process.exit(1);
}

