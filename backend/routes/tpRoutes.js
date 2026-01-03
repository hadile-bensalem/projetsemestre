const express = require('express');
const router = express.Router();
const TP = require('../models/TP');
const { protect, teacher, student } = require('../middleware/authMiddleware');

// Créer un TP (ENSEIGNANT uniquement)
router.post('/', protect, teacher, async (req, res) => {
    try {
        console.log('[POST] Requete POST /api/tps recue');
        console.log('   Body:', JSON.stringify(req.body, null, 2));
        console.log('   UserId:', req.userId);
        console.log('   UserRole:', req.userRole);

        const { title, description, filiere, fileUrl, fileName, fileSize, fileType, deadline, isPublished } = req.body;

        // Validation des champs requis
        if (!title || !filiere || !fileUrl || !fileName) {
            console.log('   [ERREUR] Validation échouée: champs manquants');
            return res.status(400).json({
                success: false,
                message: 'Les champs titre, filière, URL du fichier et nom du fichier sont requis'
            });
        }

        if (!req.userId) {
            console.log('   [ERREUR] Utilisateur non authentifié');
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        console.log('   [OK] Validation réussie, création du TP...');
        console.log('   [INFO] Données du TP:', {
            title,
            filiere,
            filiereType: typeof filiere,
            teacher: req.userId,
            isPublished: isPublished === true || isPublished === 'true' || false
        });

        const tp = await TP.create({
            title,
            description: description || '',
            teacher: req.userId,
            filiere,
            fileUrl,
            fileName,
            fileSize: fileSize || undefined,
            fileType: fileType || 'application/pdf',
            deadline: deadline ? new Date(deadline) : undefined,
            isPublished: isPublished === true || isPublished === 'true' || false
        });

        const populatedTP = await TP.findById(tp._id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        console.log('   [OK] TP créé avec succès:', tp._id);
        console.log('   [INFO] TP créé - Filière:', {
            filiereId: tp.filiere,
            filiereName: populatedTP.filiere?.name,
            filiereCode: populatedTP.filiere?.code
        });
        res.status(201).json({
            success: true,
            message: 'TP créé avec succès',
            tp: populatedTP
        });
    } catch (error) {
        console.error('   [ERREUR] Erreur lors de la creation du TP:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création du TP'
        });
    }
});

// Récupérer tous les TP (ENSEIGNANT et ÉTUDIANT)
router.get('/', protect, student, async (req, res) => {
    try {
        const { filiere, isPublished, teacherId } = req.query;
        let filter = {};

        // Si c'est un étudiant, seulement les TP publiés
        if (req.userRole === 'student') {
            filter.isPublished = true;
            
            // Récupérer la filière de l'étudiant depuis la base de données
            const User = require('../models/User');
            const mongoose = require('mongoose');
            const student = await User.findById(req.userId).populate('studentInfo.filiere');
            
            console.log(`\n[INFO] === RÉCUPÉRATION TP POUR ÉTUDIANT ===`);
            console.log(`   Étudiant ID: ${req.userId}`);
            
            if (!student || !student.studentInfo) {
                console.log('   [ERREUR] Étudiant sans studentInfo');
                return res.json({
                    success: true,
                    count: 0,
                    tps: [],
                    message: 'Informations étudiant incomplètes'
                });
            }
            
            if (!student.studentInfo.filiere) {
                console.log('   [ATTENTION]  Étudiant sans filière assignée');
                return res.json({
                    success: true,
                    count: 0,
                    tps: [],
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
                console.log('   [ERREUR] ID de filière invalide');
                return res.json({
                    success: true,
                    count: 0,
                    tps: [],
                    message: 'ID de filière invalide'
                });
            }
            
            console.log(`   [OK] Filière trouvée: ${student.studentInfo.filiere.name || 'N/A'}`);
            console.log(`   [INFO] Filière ID: ${filter.filiere.toString()}`);
            console.log(`   [INFO] Filtre complet:`, {
                isPublished: filter.isPublished,
                filiere: filter.filiere.toString()
            });
            
        } else if (req.userRole === 'teacher') {
            // Les enseignants voient leurs propres TP par défaut
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

        // Vérifier tous les TP dans la base pour déboguer
        if (req.userRole === 'student') {
            const allTPs = await TP.find({}).populate('filiere', 'name code');
            console.log(`\n[INFO] === TOUS LES TP DANS LA BASE ===`);
            allTPs.forEach((t, idx) => {
                const tpFiliereId = t.filiere?._id ? t.filiere._id.toString() : (t.filiere ? t.filiere.toString() : 'N/A');
                console.log(`   TP ${idx + 1}: "${t.title}"`);
                console.log(`      - Filière: ${t.filiere?.name || 'N/A'}`);
                console.log(`      - Filière ID: ${tpFiliereId}`);
                console.log(`      - Publié: ${t.isPublished}`);
                console.log(`      - Match filiere?: ${tpFiliereId === filter.filiere?.toString() ? '[OK] OUI' : '[NON] NON'}`);
            });
        }

        console.log(`\n[INFO] === RECHERCHE AVEC FILTRE ===`);
        console.log(`   Filtre:`, JSON.stringify({
            isPublished: filter.isPublished,
            filiere: filter.filiere ? filter.filiere.toString() : 'N/A'
        }, null, 2));

        const tps = await TP.find(filter)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code')
            .sort({ createdAt: -1 });

        console.log(`\n[OK] === RÉSULTAT ===`);
        console.log(`   ${tps.length} TP trouvés pour l'étudiant`);
        if (tps.length > 0) {
            tps.forEach((t, idx) => {
                console.log(`   ${idx + 1}. "${t.title}" - Filière: ${t.filiere?.name || 'N/A'} (ID: ${t.filiere?._id ? t.filiere._id.toString() : 'N/A'})`);
            });
        } else {
            console.log(`   [ATTENTION] Aucun TP trouve - Verifiez que les TP sont publies et ont la bonne filiere`);
        }
        console.log(`========================\n`);

        res.json({
            success: true,
            count: tps.length,
            tps
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des TP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer un TP par ID
router.get('/:id', protect, student, async (req, res) => {
    try {
        const tp = await TP.findById(req.params.id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        if (!tp) {
            return res.status(404).json({
                success: false,
                message: 'TP non trouvé'
            });
        }

        // Vérifier si l'étudiant peut voir ce TP
        if (req.userRole === 'student') {
            // Vérifier que le TP est publié
            if (!tp.isPublished) {
                return res.status(403).json({
                    success: false,
                    message: 'Ce TP n\'est pas encore publié'
                });
            }
            
            // Vérifier que le TP appartient à la filière de l'étudiant
            const User = require('../models/User');
            const student = await User.findById(req.userId).populate('studentInfo.filiere');
            
            if (student && student.studentInfo && student.studentInfo.filiere) {
                let studentFiliereId;
                if (student.studentInfo.filiere._id) {
                    studentFiliereId = student.studentInfo.filiere._id.toString();
                } else {
                    studentFiliereId = student.studentInfo.filiere.toString();
                }
                
                const tpFiliereId = tp.filiere?._id 
                    ? tp.filiere._id.toString() 
                    : tp.filiere?.toString();
                
                if (tpFiliereId !== studentFiliereId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'avez pas accès à ce TP. Ce TP appartient à une autre filière.'
                    });
                }
            }
        }

        res.json({
            success: true,
            tp
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour un TP (ENSEIGNANT uniquement - propriétaire)
router.put('/:id', protect, teacher, async (req, res) => {
    try {
        const tp = await TP.findById(req.params.id);

        if (!tp) {
            return res.status(404).json({
                success: false,
                message: 'TP non trouvé'
            });
        }

        // Vérifier que l'enseignant est le propriétaire
        if (tp.teacher.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de modifier ce TP'
            });
        }

        const { title, description, filiere, fileUrl, fileName, fileSize, fileType, deadline, isPublished } = req.body;

        if (title) tp.title = title;
        if (description !== undefined) tp.description = description;
        if (filiere) tp.filiere = filiere;
        if (fileUrl) tp.fileUrl = fileUrl;
        if (fileName) tp.fileName = fileName;
        if (fileSize) tp.fileSize = fileSize;
        if (fileType) tp.fileType = fileType;
        if (deadline) tp.deadline = deadline;
        if (isPublished !== undefined) {
            tp.isPublished = isPublished;
            if (isPublished && !tp.publishedAt) {
                tp.publishedAt = new Date();
            }
        }

        await tp.save();

        const updatedTP = await TP.findById(tp._id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        res.json({
            success: true,
            message: 'TP mis à jour avec succès',
            tp: updatedTP
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer un TP (ENSEIGNANT uniquement - propriétaire)
router.delete('/:id', protect, teacher, async (req, res) => {
    try {
        const tp = await TP.findById(req.params.id);

        if (!tp) {
            return res.status(404).json({
                success: false,
                message: 'TP non trouvé'
            });
        }

        // Vérifier que l'enseignant est le propriétaire
        if (tp.teacher.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de supprimer ce TP'
            });
        }

        await TP.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'TP supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

