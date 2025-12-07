const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// Créer un étudiant (ADMIN uniquement)
router.post('/', protect, admin, async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            phone,
            address,
            filiere,
            studentNumber
        } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'student',
            studentInfo: {
                firstName,
                lastName,
                dateOfBirth,
                phone,
                address,
                filiere,
                studentNumber
            }
        });

        const populatedStudent = await User.findById(student._id)
            .select('-password')
            .populate('studentInfo.filiere');

        res.status(201).json({
            success: true,
            message: 'Étudiant créé avec succès',
            student: populatedStudent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lire tous les étudiants (ADMIN uniquement)
router.get('/', protect, admin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .populate('studentInfo.filiere')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lire un étudiant par ID (ADMIN uniquement)
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const student = await User.findOne({ 
            _id: req.params.id, 
            role: 'student' 
        })
        .select('-password')
        .populate('studentInfo.filiere');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.json({
            success: true,
            student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour un étudiant (ADMIN uniquement)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            phone,
            address,
            filiere,
            studentNumber,
            isActive
        } = req.body;

        const student = await User.findOne({ 
            _id: req.params.id, 
            role: 'student' 
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Vérifier si l'email existe déjà pour un autre utilisateur
        if (email && email !== student.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email déjà utilisé'
                });
            }
        }

        // Mettre à jour les champs
        if (username) student.username = username;
        if (email) student.email = email;
        if (password) student.password = await bcrypt.hash(password, 10);
        if (isActive !== undefined) student.isActive = isActive;

        // Mettre à jour studentInfo
        if (firstName) student.studentInfo.firstName = firstName;
        if (lastName) student.studentInfo.lastName = lastName;
        if (dateOfBirth) student.studentInfo.dateOfBirth = dateOfBirth;
        if (phone) student.studentInfo.phone = phone;
        if (address) student.studentInfo.address = address;
        if (filiere) student.studentInfo.filiere = filiere;
        if (studentNumber) student.studentInfo.studentNumber = studentNumber;

        await student.save();

        const updatedStudent = await User.findById(student._id)
            .select('-password')
            .populate('studentInfo.filiere');

        res.json({
            success: true,
            message: 'Étudiant mis à jour avec succès',
            student: updatedStudent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer un étudiant (ADMIN uniquement)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ 
            _id: req.params.id, 
            role: 'student' 
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Étudiant supprimé avec succès',
            student: {
                id: student._id,
                username: student.username,
                email: student.email
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