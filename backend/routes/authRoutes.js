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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Inscription ADMIN uniquement (première fois)
router.post('/register-admin', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Vérifier s'il existe déjà un admin
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(403).json({
                success: false,
                message: 'Un administrateur existe déjà'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email déjà utilisé'
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;