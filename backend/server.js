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

require('dotenv').config();

const app = express();

// Connexion à MongoDB
connectDB();

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/filieres', filiereRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tps', tpRoutes);
app.use('/api/exams', examRoutes);

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
    console.log(` Serveur démarré sur le port ${PORT}`);
});