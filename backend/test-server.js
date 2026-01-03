/**
 * Script pour tester que le serveur peut démarrer sans erreur
 */

console.log('[TEST] Test de demarrage du serveur...\n');

try {
    // Tester le chargement des modules
    console.log('1. Test des modules...');
    const express = require('express');
    const cors = require('cors');
    const mongoose = require('mongoose');
    const multer = require('multer');
    console.log('   [OK] express chargé');
    console.log('   [OK] cors chargé');
    console.log('   [OK] mongoose chargé');
    console.log('   [OK] multer chargé\n');

    // Tester le chargement des routes
    console.log('2. Test du chargement des routes...');
    const courseRoutes = require('./routes/courseRoutes');
    console.log('   [OK] courseRoutes chargé');
    const tpRoutes = require('./routes/tpRoutes');
    console.log('   [OK] tpRoutes chargé');
    const examRoutes = require('./routes/examRoutes');
    console.log('   [OK] examRoutes chargé');
    const uploadRoutes = require('./routes/uploadRoutes');
    console.log('   [OK] uploadRoutes chargé\n');

    // Tester le chargement des middlewares
    console.log('3. Test du chargement des middlewares...');
    const uploadMiddleware = require('./middleware/uploadMiddleware');
    console.log('   [OK] uploadMiddleware chargé');
    const authMiddleware = require('./middleware/authMiddleware');
    console.log('   [OK] authMiddleware chargé\n');

    // Tester le chargement des modèles
    console.log('4. Test du chargement des modèles...');
    const Course = require('./models/Course');
    console.log('   [OK] Course chargé');
    const TP = require('./models/TP');
    console.log('   [OK] TP chargé');
    const Exam = require('./models/Exam');
    console.log('   [OK] Exam chargé\n');

    console.log('[OK] Tous les tests sont passes ! Le serveur devrait demarrer correctement.\n');
    console.log('[INFO] Pour demarrer le serveur :');
    console.log('   cd backend');
    console.log('   npm start\n');

} catch (error) {
    console.error('[ERREUR] Erreur lors du test:', error.message);
    console.error('\n[INFO] Details de l\'erreur:');
    console.error(error.stack);
    process.exit(1);
}

