const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Filiere = require('../models/Filiere');
const { protect, admin } = require('../middleware/authMiddleware');

// Protéger toutes les routes admin
router.use(protect);
router.use(admin);

// Créer un compte étudiant
router.post('/create-student', async (req, res) => {
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
            filiereId,
            studentNumber
        } = req.body;

        // Vérifier si l'email existe déjà
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        // Vérifier si la filière existe
        const filiere = await Filiere.findById(filiereId);
        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
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
                filiere: filiereId,
                studentNumber
            }
        });

        res.status(201).json({
            success: true,
            message: 'Compte étudiant créé avec succès',
            student: {
                id: student._id,
                username: student.username,
                email: student.email,
                role: student.role,
                studentInfo: student.studentInfo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Créer un compte enseignant
router.post('/create-teacher', async (req, res) => {
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

        // Vérifier si l'email existe déjà
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

        res.status(201).json({
            success: true,
            message: 'Compte enseignant créé avec succès',
            teacher: {
                id: teacher._id,
                username: teacher.username,
                email: teacher.email,
                role: teacher.role,
                teacherInfo: teacher.teacherInfo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Activer/Désactiver un compte
router.patch('/toggle-user-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Empêcher la désactivation du dernier admin
        if (user.role === 'admin' && !isActive) {
            const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de désactiver le dernier administrateur'
                });
            }
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            success: true,
            message: `Compte ${isActive ? 'activé' : 'désactivé'} avec succès`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lister tous les utilisateurs
router.get('/users', async (req, res) => {
    try {
        const { role, isActive } = req.query;
        let filter = {};

        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const users = await User.find(filter)
            .select('-password')
            .populate('studentInfo.filiere', 'name code')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Obtenir les statistiques du dashboard
router.get('/dashboard-stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false }),
            Filiere.countDocuments(),
            Filiere.countDocuments({ isActive: true })
        ]);

        res.json({
            success: true,
            stats: {
                totalStudents: stats[0],
                totalTeachers: stats[1],
                totalAdmins: stats[2],
                activeUsers: stats[3],
                inactiveUsers: stats[4],
                totalFilieres: stats[5],
                activeFilieres: stats[6]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer un utilisateur
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Empêcher la suppression du dernier admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de supprimer le dernier administrateur'
                });
            }
        }

        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour les informations d'un utilisateur
router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour les champs de base
        if (updates.username) user.username = updates.username;
        if (updates.email) {
            // Vérifier si le nouvel email est déjà utilisé
            const emailExists = await User.findOne({ email: updates.email, _id: { $ne: userId } });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email déjà utilisé'
                });
            }
            user.email = updates.email;
        }

        // Mettre à jour les informations spécifiques selon le rôle
        if (user.role === 'student' && updates.studentInfo) {
            user.studentInfo = { ...user.studentInfo, ...updates.studentInfo };
        }
        if (user.role === 'teacher' && updates.teacherInfo) {
            user.teacherInfo = { ...user.teacherInfo, ...updates.teacherInfo };
        }

        // Mettre à jour le mot de passe si fourni
        if (updates.password) {
            user.password = await bcrypt.hash(updates.password, 10);
        }

        await user.save();

        res.json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                studentInfo: user.studentInfo,
                teacherInfo: user.teacherInfo,
                isActive: user.isActive
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
