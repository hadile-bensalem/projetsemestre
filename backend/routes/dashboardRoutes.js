const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Filiere = require('../models/Filiere');
const { protect, admin, teacher, studentOnly, teacherOnly } = require('../middleware/authMiddleware');

// Protéger toutes les routes dashboard
router.use(protect);

// Dashboard Admin
router.get('/admin', admin, async (req, res) => {
    try {
        const stats = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false }),
            Filiere.countDocuments(),
            Filiere.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'student', isActive: true }),
            User.countDocuments({ role: 'teacher', isActive: true })
        ]);

        // Récupérer les utilisateurs récents
        const recentUsers = await User.find()
            .select('-password')
            .populate('studentInfo.filiere', 'name code')
            .sort({ createdAt: -1 })
            .limit(10);

        // Récupérer les statistiques par filière
        const filiereStats = await Filiere.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'studentInfo.filiere',
                    as: 'students'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    studentCount: { $size: '$students' },
                    activeStudentCount: {
                        $size: {
                            $filter: {
                                input: '$students',
                                cond: { $eq: ['$$this.isActive', true] }
                            }
                        }
                    }
                }
            }
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
                activeFilieres: stats[6],
                activeStudents: stats[7],
                activeTeachers: stats[8]
            },
            recentUsers,
            filiereStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Dashboard Enseignant
router.get('/teacher', teacher, async (req, res) => {
    try {
        const teacherId = req.userId;
        
        // Statistiques de base
        const stats = await Promise.all([
            User.countDocuments({ role: 'student', isActive: true }),
            Filiere.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'teacher', isActive: true })
        ]);

        // Récupérer les informations de l'enseignant
        const teacher = await User.findById(teacherId)
            .select('-password')
            .populate('teacherInfo');

        // Récupérer tous les étudiants actifs avec leur filière
        const students = await User.find({ 
            role: 'student', 
            isActive: true 
        })
        .select('-password')
        .populate('studentInfo.filiere', 'name code')
        .sort({ 'studentInfo.lastName': 1, 'studentInfo.firstName': 1 });

        // Statistiques par filière
        const filiereStats = await Filiere.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'studentInfo.filiere',
                    as: 'students'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    studentCount: { $size: '$students' },
                    activeStudentCount: {
                        $size: {
                            $filter: {
                                input: '$students',
                                cond: { $eq: ['$$this.isActive', true] }
                            }
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            teacher,
            stats: {
                totalStudents: stats[0],
                totalFilieres: stats[1],
                totalTeachers: stats[2]
            },
            students,
            filiereStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Dashboard Étudiant
router.get('/student', studentOnly, async (req, res) => {
    try {
        const studentId = req.userId;
        
        // Récupérer les informations complètes de l'étudiant
        const student = await User.findById(studentId)
            .select('-password')
            .populate('studentInfo.filiere');

        // Statistiques générales
        const stats = await Promise.all([
            User.countDocuments({ role: 'student', isActive: true }),
            User.countDocuments({ role: 'teacher', isActive: true }),
            Filiere.countDocuments({ isActive: true })
        ]);

        // Récupérer les enseignants actifs
        const teachers = await User.find({ 
            role: 'teacher', 
            isActive: true 
        })
        .select('-password')
        .sort({ 'teacherInfo.lastName': 1, 'teacherInfo.firstName': 1 });

        // Récupérer les informations de la filière de l'étudiant
        let filiereInfo = null;
        if (student.studentInfo && student.studentInfo.filiere) {
            filiereInfo = await Filiere.findById(student.studentInfo.filiere._id);
        }

        res.json({
            success: true,
            student,
            filiereInfo,
            stats: {
                totalStudents: stats[0],
                totalTeachers: stats[1],
                totalFilieres: stats[2]
            },
            teachers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Profil utilisateur (commun à tous les rôles)
router.get('/profile', async (req, res) => {
    try {
        const userId = req.userId;
        
        let user = await User.findById(userId)
            .select('-password')
            .populate('studentInfo.filiere', 'name code description');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour le profil
router.put('/profile', async (req, res) => {
    try {
        const userId = req.userId;
        const updates = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à uniquement les informations autorisées
        if (updates.username) user.username = updates.username;
        if (updates.phone) {
            if (user.role === 'student') {
                user.studentInfo.phone = updates.phone;
            } else if (user.role === 'teacher') {
                user.teacherInfo.phone = updates.phone;
            }
        }
        if (updates.address && user.role === 'student') {
            user.studentInfo.address = updates.address;
        }
        if (updates.specialization && user.role === 'teacher') {
            user.teacherInfo.specialization = updates.specialization;
        }

        await user.save();

        let updatedUser = await User.findById(userId)
            .select('-password')
            .populate('studentInfo.filiere', 'name code description');

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
