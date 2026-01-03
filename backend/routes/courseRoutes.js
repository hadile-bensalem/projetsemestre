const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, teacher, student } = require('../middleware/authMiddleware');

// Créer un cours (ENSEIGNANT uniquement)
router.post('/', protect, teacher, async (req, res) => {
    try {
        console.log('[POST] Requete POST /api/courses recue');
        console.log('   Headers:', JSON.stringify(req.headers, null, 2));
        console.log('   Body:', JSON.stringify(req.body, null, 2));
        console.log('   UserId:', req.userId);
        console.log('   UserRole:', req.userRole);

        const { title, description, filiere, fileUrl, fileName, fileSize, fileType, isPublished } = req.body;

        // Validation des champs requis
        if (!title || !filiere || !fileUrl || !fileName) {
            console.log(' Validation échouée: champs manquants');
            return res.status(400).json({
                success: false,
                message: 'Les champs titre, filière, URL du fichier et nom du fichier sont requis'
            });
        }

        // fileSize est optionnel maintenant

        if (!req.userId) {
            console.log('   [ERREUR] Utilisateur non authentifie');
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        console.log('   [OK] Validation reussie, creation du cours...');
        console.log('   [INFO] Donnees du cours:', {
            title,
            filiere,
            filiereType: typeof filiere,
            teacher: req.userId,
            isPublished: isPublished === true || isPublished === 'true' || false
        });

        const course = await Course.create({
            title,
            description: description || '',
            teacher: req.userId,
            filiere,
            fileUrl,
            fileName,
            fileSize: fileSize || undefined,
            fileType: fileType || 'application/pdf',
            isPublished: isPublished === true || isPublished === 'true' || false
        });

        const populatedCourse = await Course.findById(course._id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        console.log('   [OK] Cours cree avec succes:', course._id);
        console.log('   [INFO] Cours cree - Filiere:', {
            filiereId: course.filiere,
            filiereName: populatedCourse.filiere?.name,
            filiereCode: populatedCourse.filiere?.code
        });
        res.status(201).json({
            success: true,
            message: 'Cours créé avec succès',
            course: populatedCourse
        });
    } catch (error) {
        console.error('   [ERREUR] Erreur lors de la creation du cours:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création du cours'
        });
    }
});

// Récupérer tous les cours (ENSEIGNANT et ÉTUDIANT)
router.get('/', protect, student, async (req, res) => {
    try {
        const { filiere, isPublished, teacherId } = req.query;
        let filter = {};

        // Si c'est un étudiant, seulement les cours publiés
        if (req.userRole === 'student') {
            filter.isPublished = true;
            
            // Récupérer la filière de l'étudiant depuis la base de données
            const User = require('../models/User');
            const mongoose = require('mongoose');
            const student = await User.findById(req.userId).populate('studentInfo.filiere');
            
            console.log(`\n[INFO] === RECUPERATION COURS POUR ETUDIANT ===`);
            console.log(`   Etudiant ID: ${req.userId}`);
            
            if (!student || !student.studentInfo) {
                console.log('   [ERREUR] Etudiant sans studentInfo');
                return res.json({
                    success: true,
                    count: 0,
                    courses: [],
                    message: 'Informations étudiant incomplètes'
                });
            }
            
            if (!student.studentInfo.filiere) {
                console.log('   [ATTENTION] Etudiant sans filiere assignee');
                return res.json({
                    success: true,
                    count: 0,
                    courses: [],
                    message: 'Aucune filière assignée à cet étudiant'
                });
            }
            
            // Récupérer l'ID de la filière de manière robuste
            let studentFiliereId;
            if (student.studentInfo.filiere._id) {
                // Si c'est un objet peuplé, prendre l'_id
                studentFiliereId = student.studentInfo.filiere._id;
            } else {
                // Si c'est un ObjectId directement
                studentFiliereId = student.studentInfo.filiere;
            }
            
            // S'assurer que c'est un ObjectId valide pour le filtre MongoDB
            // Utiliser mongoose.Types.ObjectId pour garantir la compatibilité
            if (mongoose.Types.ObjectId.isValid(studentFiliereId)) {
                filter.filiere = new mongoose.Types.ObjectId(studentFiliereId);
            } else {
                console.log('   [ERREUR] ID de filiere invalide');
                return res.json({
                    success: true,
                    count: 0,
                    courses: [],
                    message: 'ID de filière invalide'
                });
            }
            
            console.log(`   [OK] Filiere trouvee: ${student.studentInfo.filiere.name || 'N/A'}`);
            console.log(`   [INFO] Filiere ID: ${filter.filiere.toString()}`);
            console.log(`   [INFO] Filtre complet:`, {
                isPublished: filter.isPublished,
                filiere: filter.filiere.toString()
            });
            
        } else if (req.userRole === 'teacher') {
            // Les enseignants voient leurs propres cours par défaut
            filter.teacher = req.userId;
            
            // Si une filière est spécifiée dans la requête, l'utiliser (pour les enseignants)
            if (filiere) {
                const mongoose = require('mongoose');
                filter.filiere = mongoose.Types.ObjectId.isValid(filiere) 
                    ? new mongoose.Types.ObjectId(filiere)
                    : filiere;
            }
            
            if (isPublished !== undefined) {
                filter.isPublished = isPublished === 'true';
            }
        }
        
        // Pour les étudiants, NE PAS permettre de modifier le filtre après sa définition
        // Le filtre est déjà défini ci-dessus et ne doit pas être modifié
        
        if (teacherId && req.userRole !== 'student') {
            filter.teacher = teacherId;
        }

        // Vérifier tous les cours dans la base pour déboguer
        if (req.userRole === 'student') {
            const allCourses = await Course.find({}).populate('filiere', 'name code');
            console.log(`\n[INFO] === TOUS LES COURS DANS LA BASE ===`);
            allCourses.forEach((c, idx) => {
                const courseFiliereId = c.filiere?._id ? c.filiere._id.toString() : (c.filiere ? c.filiere.toString() : 'N/A');
                console.log(`   Cours ${idx + 1}: "${c.title}"`);
                console.log(`      - Filière: ${c.filiere?.name || 'N/A'}`);
                console.log(`      - Filière ID: ${courseFiliereId}`);
                console.log(`      - Publié: ${c.isPublished}`);
                console.log(`      - Match filiere?: ${courseFiliereId === filter.filiere?.toString() ? '[OK] OUI' : '[NON] NON'}`);
            });
        }

        console.log(`\n[INFO] === RECHERCHE AVEC FILTRE ===`);
        console.log(`   Filtre:`, JSON.stringify({
            isPublished: filter.isPublished,
            filiere: filter.filiere ? filter.filiere.toString() : 'N/A'
        }, null, 2));

        const courses = await Course.find(filter)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code')
            .sort({ createdAt: -1 });

        console.log(`\n[OK] === RESULTAT ===`);
        console.log(`   ${courses.length} cours trouvés pour l'étudiant`);
        if (courses.length > 0) {
            courses.forEach((c, idx) => {
                console.log(`   ${idx + 1}. "${c.title}" - Filière: ${c.filiere?.name || 'N/A'} (ID: ${c.filiere?._id ? c.filiere._id.toString() : 'N/A'})`);
            });
        } else {
            console.log(`   [ATTENTION] Aucun cours trouve - Verifiez que les cours sont publies et ont la bonne filiere`);
        }
        console.log(`========================\n`);

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer un cours par ID
router.get('/:id', protect, student, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier si l'étudiant peut voir ce cours
        if (req.userRole === 'student') {
            // Vérifier que le cours est publié
            if (!course.isPublished) {
                return res.status(403).json({
                    success: false,
                    message: 'Ce cours n\'est pas encore publié'
                });
            }
            
            // Vérifier que le cours appartient à la filière de l'étudiant
            const User = require('../models/User');
            const mongoose = require('mongoose');
            const student = await User.findById(req.userId).populate('studentInfo.filiere');
            
            if (student && student.studentInfo && student.studentInfo.filiere) {
                let studentFiliereId;
                if (student.studentInfo.filiere._id) {
                    studentFiliereId = student.studentInfo.filiere._id.toString();
                } else {
                    studentFiliereId = student.studentInfo.filiere.toString();
                }
                
                const courseFiliereId = course.filiere?._id 
                    ? course.filiere._id.toString() 
                    : course.filiere?.toString();
                
                if (courseFiliereId !== studentFiliereId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'avez pas accès à ce cours. Ce cours appartient à une autre filière.'
                    });
                }
            }
        }

        res.json({
            success: true,
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour un cours (ENSEIGNANT uniquement - propriétaire)
router.put('/:id', protect, teacher, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier que l'enseignant est le propriétaire
        if (course.teacher.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de modifier ce cours'
            });
        }

        const { title, description, filiere, fileUrl, fileName, fileSize, fileType, isPublished } = req.body;

        if (title) course.title = title;
        if (description !== undefined) course.description = description;
        if (filiere) course.filiere = filiere;
        if (fileUrl) course.fileUrl = fileUrl;
        if (fileName) course.fileName = fileName;
        if (fileSize) course.fileSize = fileSize;
        if (fileType) course.fileType = fileType;
        if (isPublished !== undefined) {
            course.isPublished = isPublished;
            if (isPublished && !course.publishedAt) {
                course.publishedAt = new Date();
            }
        }

        await course.save();

        const updatedCourse = await Course.findById(course._id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        res.json({
            success: true,
            message: 'Cours mis à jour avec succès',
            course: updatedCourse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer un cours (ENSEIGNANT uniquement - propriétaire)
router.delete('/:id', protect, teacher, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier que l'enseignant est le propriétaire
        if (course.teacher.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de supprimer ce cours'
            });
        }

        await Course.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Cours supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

