const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, email, role) => {
    return jwt.sign(
        { userId: id, email, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Login pour tous (admin, teacher, student)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des champs requis
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
        }

        const user = await User.findOne({ email }).populate('studentInfo.filiere teacherInfo');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Compte désactivé. Contactez l\'administrateur.'
            });
        }

        // Vérifier si le mot de passe est hashé (commence par $2a$ ou $2b$)
        const isPasswordHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
        
        if (!isPasswordHashed) {
            console.warn(`[ATTENTION] ATTENTION: Le mot de passe de l'utilisateur ${email} n'est pas hashe!`);
            console.warn('   Utilisez le script fix-admin.js pour réparer le mot de passe.');
            return res.status(401).json({
                success: false,
                message: 'Le mot de passe doit être réinitialisé. Contactez l\'administrateur.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const token = generateToken(user._id, user.email, user.role);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                studentInfo: user.role === 'student' ? user.studentInfo : undefined,
                teacherInfo: user.role === 'teacher' ? user.teacherInfo : undefined
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la connexion'
        });
    }
});

// Inscription ADMIN uniquement (première fois)
router.post('/register-admin', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation des champs requis
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (username, email, password)'
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            });
        }

        // Validation du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Vérifier s'il existe déjà un admin
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(403).json({
                success: false,
                message: 'Un administrateur existe déjà'
            });
        }

        // Vérifier si l'email existe déjà
        const userExistsByEmail = await User.findOne({ email });
        if (userExistsByEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        // Vérifier si le username existe déjà
        const userExistsByUsername = await User.findOne({ username });
        if (userExistsByUsername) {
            return res.status(400).json({
                success: false,
                message: 'Nom d\'utilisateur déjà utilisé'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        const token = generateToken(admin._id, admin.email, admin.role);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        // Gestion des erreurs MongoDB
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field === 'email' ? 'Email' : 'Nom d\'utilisateur'} déjà utilisé`
            });
        }

        console.error('Erreur lors de l\'inscription admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de l\'inscription'
        });
    }
});

module.exports = router;