const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const filiereRoutes = require('./routes/filiereRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const courseRoutes = require('./routes/courseRoutes');
const tpRoutes = require('./routes/tpRoutes');
const examRoutes = require('./routes/examRoutes');
// Charger les routes avec gestion d'erreur
let uploadRoutes;
try {
    uploadRoutes = require('./routes/uploadRoutes');
    console.log('[OK] Route uploadRoutes chargee');
} catch (error) {
    console.error('[ERREUR] Erreur lors du chargement de uploadRoutes:', error.message);
    // Créer une route vide pour éviter que le serveur ne plante
    uploadRoutes = require('express').Router();
}

require('dotenv').config();

const app = express();

// Connexion à MongoDB (asynchrone, ne bloque pas le démarrage)
connectDB().catch(err => {
    console.error('[ERREUR] Erreur de connexion MongoDB:', err.message);
    // Ne pas arrêter le serveur, continuer pour voir les autres erreurs
});

// Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001', // Port alternatif si 3000 est occupé
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads et certificats)
const path = require('path');
const fs = require('fs');

// Créer le dossier certificates s'il n'existe pas
const certificatesDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
    console.log('[OK] Dossier certificates cree');
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route spécifique pour servir les certificats (plus fiable qu'une route statique)
app.get('/api/certificates/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'certificates', filename);
        
        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
            console.error(`[ERREUR] Certificat non trouve: ${filename}`);
            return res.status(404).json({
                success: false,
                message: 'Certificat non trouvé'
            });
        }
        
        // Envoyer le fichier avec le bon type MIME
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('[ERREUR] Erreur lors de l\'envoi du certificat:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Erreur lors de l\'envoi du certificat'
                    });
                }
            }
        });
    } catch (error) {
        console.error('[ERREUR] Erreur dans la route certificats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du certificat'
        });
    }
});

// Routes avec logs pour le débogage
console.log('[INFO] Enregistrement des routes...');
app.use('/api/auth', authRoutes);
console.log('  [OK] /api/auth');
app.use('/api/students', studentRoutes);
console.log('  [OK] /api/students');
app.use('/api/teachers', teacherRoutes);
console.log('  [OK] /api/teachers');
app.use('/api/filieres', filiereRoutes);
console.log('  [OK] /api/filieres');
app.use('/api/admin', adminRoutes);
console.log('  [OK] /api/admin');
app.use('/api/dashboard', dashboardRoutes);
console.log('  [OK] /api/dashboard');
app.use('/api/courses', courseRoutes);
console.log('  [OK] /api/courses');
app.use('/api/tps', tpRoutes);
console.log('  [OK] /api/tps');
app.use('/api/exams', examRoutes);
console.log('  [OK] /api/exams');
app.use('/api/upload', uploadRoutes);
console.log('  [OK] /api/upload');
console.log('  [OK] /api/certificates/:filename (route certificats)');
console.log('[OK] Toutes les routes enregistrees');

// Route de test
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'API Système de Gestion Académique',
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 5000;

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
    console.error('[ERREUR] Erreur non geree:', err);
});

process.on('uncaughtException', (err) => {
    console.error('[ERREUR] Exception non capturee:', err);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`\n[OK] Serveur demarre sur le port ${PORT}`);
    console.log(`[OK] API disponible sur http://localhost:${PORT}`);
    console.log(`[OK] Routes disponibles:`);
    console.log(`   - GET  http://localhost:${PORT}/`);
    console.log(`   - POST http://localhost:${PORT}/api/courses`);
    console.log(`   - POST http://localhost:${PORT}/api/tps`);
    console.log(`   - POST http://localhost:${PORT}/api/exams`);
    console.log(`   - POST http://localhost:${PORT}/api/upload/pdf\n`);
});