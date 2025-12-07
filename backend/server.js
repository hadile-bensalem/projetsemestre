const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const filiereRoutes = require('./routes/filiereRoutes');

require('dotenv').config();

const app = express();

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/filieres', filiereRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'API Système de Gestion Académique',
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});