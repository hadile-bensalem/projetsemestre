const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// Créer un professeur (ADMIN uniquement)
router.post('/', protect, admin, async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            specialization,
            teacherNumber
        } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const teacher = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'teacher',
            teacherInfo: {
                firstName,
                lastName,
                phone,
                specialization,
                teacherNumber
            }
        });

        const populatedTeacher = await User.findById(teacher._id).select('-password');

        res.status(201).json({
            success: true,
            message: 'Professeur créé avec succès',
            teacher: populatedTeacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lire tous les professeurs (ADMIN uniquement)
router.get('/', protect, admin, async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: teachers.length,
            teachers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lire un professeur par ID (ADMIN uniquement)
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const teacher = await User.findOne({ 
            _id: req.params.id, 
            role: 'teacher' 
        }).select('-password');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Professeur non trouvé'
            });
        }

        res.json({
            success: true,
            teacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour un professeur (ADMIN uniquement)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            specialization,
            teacherNumber,
            isActive
        } = req.body;

        const teacher = await User.findOne({ 
            _id: req.params.id, 
            role: 'teacher' 
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Professeur non trouvé'
            });
        }

        if (email && email !== teacher.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email déjà utilisé'
                });
            }
        }

        if (username) teacher.username = username;
        if (email) teacher.email = email;
        if (password) teacher.password = await bcrypt.hash(password, 10);
        if (isActive !== undefined) teacher.isActive = isActive;

        if (firstName) teacher.teacherInfo.firstName = firstName;
        if (lastName) teacher.teacherInfo.lastName = lastName;
        if (phone) teacher.teacherInfo.phone = phone;
        if (specialization) teacher.teacherInfo.specialization = specialization;
        if (teacherNumber) teacher.teacherInfo.teacherNumber = teacherNumber;

        await teacher.save();

        const updatedTeacher = await User.findById(teacher._id).select('-password');

        res.json({
            success: true,
            message: 'Professeur mis à jour avec succès',
            teacher: updatedTeacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer un professeur (ADMIN uniquement)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const teacher = await User.findOneAndDelete({ 
            _id: req.params.id, 
            role: 'teacher' 
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Professeur non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Professeur supprimé avec succès',
            teacher: {
                id: teacher._id,
                username: teacher.username,
                email: teacher.email
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