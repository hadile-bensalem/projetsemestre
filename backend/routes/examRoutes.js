const express = require('express');
const router = express.Router();
const path = require('path');
const Exam = require('../models/Exam');
const ExamSubmission = require('../models/ExamSubmission');
const { protect, teacher, student } = require('../middleware/authMiddleware');
const { generateCertificate } = require('../utils/certificateGenerator');

// Créer un examen (ENSEIGNANT uniquement)
router.post('/', protect, teacher, async (req, res) => {
    try {
        console.log(' Requête POST /api/exams reçue');
        console.log('   Body:', JSON.stringify(req.body, null, 2));
        console.log('   UserId:', req.userId);
        console.log('   UserRole:', req.userRole);

        const { title, description, filiere, questions, duration, startDate, endDate, isPublished, minPassingScore, availabilityDate } = req.body;

        // Validation des champs requis
        if (!title || !filiere || !duration || !startDate || !endDate) {
            console.log(' Validation échouée: champs manquants');
            return res.status(400).json({
                success: false,
                message: 'Les champs titre, filière, durée, date de début et date de fin sont requis'
            });
        }

        // Si availabilityDate n'est pas fourni, utiliser startDate
        const finalAvailabilityDate = availabilityDate || startDate;

        // Validation des questions
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            console.log(' Validation échouée: aucune question');
            return res.status(400).json({
                success: false,
                message: 'Veuillez ajouter au moins une question'
            });
        }

        if (!req.userId) {
            console.log('  Utilisateur non authentifié');
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        console.log('   [OK] Validation reussie, creation de l\'examen...');
        console.log(' Données de l\'examen:', {
            title,
            filiere,
            filiereType: typeof filiere,
            teacher: req.userId,
            questionsCount: questions?.length || 0,
            isPublished: isPublished === true || isPublished === 'true' || false
        });

        const exam = await Exam.create({
            title,
            description,
            teacher: req.userId,
            filiere,
            questions: questions || [],
            duration,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isPublished: isPublished === true || isPublished === 'true' || false,
            minPassingScore: minPassingScore || 50,
            availabilityDate: new Date(finalAvailabilityDate)
        });

        const populatedExam = await Exam.findById(exam._id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        console.log(' Examen créé avec succès:', exam._id);
        console.log(' Examen créé - Filière:', {
            filiereId: exam.filiere,
            filiereName: populatedExam.filiere?.name,
            filiereCode: populatedExam.filiere?.code
        });
        res.status(201).json({
            success: true,
            message: 'Examen créé avec succès',
            exam: populatedExam
        });
    } catch (error) {
        console.error(' Erreur lors de la création de l\'examen:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de l\'examen'
        });
    }
});

// Récupérer tous les examens (ENSEIGNANT et ÉTUDIANT)
router.get('/', protect, student, async (req, res) => {
    try {
        const { filiere, isPublished, teacherId } = req.query;
        let filter = {};

        // Si c'est un étudiant, seulement les examens publiés
        if (req.userRole === 'student') {
            filter.isPublished = true;
            
            // Récupérer la filière de l'étudiant depuis la base de données
            const User = require('../models/User');
            const mongoose = require('mongoose');
            const student = await User.findById(req.userId).populate('studentInfo.filiere');
            
            console.log(`\n[INFO] === RECUPERATION EXAMENS POUR ETUDIANT ===`);
            console.log(`   Étudiant ID: ${req.userId}`);
            
            if (!student || !student.studentInfo) {
                console.log('   [ERREUR] Etudiant sans studentInfo');
                return res.json({
                    success: true,
                    count: 0,
                    exams: [],
                    message: 'Informations étudiant incomplètes'
                });
            }
            
            if (!student.studentInfo.filiere) {
                console.log('   [ATTENTION] Etudiant sans filiere assignee');
                return res.json({
                    success: true,
                    count: 0,
                    exams: [],
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
                    exams: [],
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
            // Les enseignants voient leurs propres examens par défaut
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

        // Vérifier tous les examens dans la base pour déboguer
        if (req.userRole === 'student') {
            const allExams = await Exam.find({}).populate('filiere', 'name code');
            console.log(`\n[INFO] === TOUS LES EXAMENS DANS LA BASE ===`);
            allExams.forEach((e, idx) => {
                const examFiliereId = e.filiere?._id ? e.filiere._id.toString() : (e.filiere ? e.filiere.toString() : 'N/A');
                console.log(`   Examen ${idx + 1}: "${e.title}"`);
                console.log(`      - Filière: ${e.filiere?.name || 'N/A'}`);
                console.log(`      - Filière ID: ${examFiliereId}`);
                console.log(`      - Publié: ${e.isPublished}`);
                console.log(`      - Match filiere?: ${examFiliereId === filter.filiere?.toString() ? '[OK] OUI' : '[NON] NON'}`);
            });
        }

        console.log(`\n[INFO] === RECHERCHE AVEC FILTRE ===`);
        console.log(`   Filtre:`, JSON.stringify({
            isPublished: filter.isPublished,
            filiere: filter.filiere ? filter.filiere.toString() : 'N/A'
        }, null, 2));

        const exams = await Exam.find(filter)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code')
            .sort({ createdAt: -1 });

        console.log(`\n[OK] === RESULTAT ===`);
        console.log(`   ${exams.length} examens trouvés pour l'étudiant`);
        if (exams.length > 0) {
            exams.forEach((e, idx) => {
                console.log(`   ${idx + 1}. "${e.title}" - Filière: ${e.filiere?.name || 'N/A'} (ID: ${e.filiere?._id ? e.filiere._id.toString() : 'N/A'})`);
            });
        } else {
            console.log(`  Aucun examen trouvé - Vérifiez que les examens sont publiés et ont la bonne filière`);
        }
        console.log(`========================\n`);

        res.json({
            success: true,
            count: exams.length,
            exams
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des examens:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer un examen par ID
router.get('/:id', protect, student, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Examen non trouvé'
            });
        }

        // Vérifier si l'étudiant peut voir cet examen
        if (req.userRole === 'student') {
            // Vérifier que l'examen est publié
            if (!exam.isPublished) {
                return res.status(403).json({
                    success: false,
                    message: 'Cet examen n\'est pas encore publié'
                });
            }
            
            // Vérifier que l'examen appartient à la filière de l'étudiant
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
                
                const examFiliereId = exam.filiere?._id 
                    ? exam.filiere._id.toString() 
                    : exam.filiere?.toString();
                
                if (examFiliereId !== studentFiliereId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'avez pas accès à cet examen. Cet examen appartient à une autre filière.'
                    });
                }
            }
            
            // Vérifier si l'étudiant a déjà réussi cet examen
            const existingSubmission = await ExamSubmission.findOne({ 
                exam: req.params.id, 
                student: req.userId 
            });
            
            if (existingSubmission && existingSubmission.isSubmitted && existingSubmission.passed) {
                return res.json({
                    success: true,
                    exam: exam,
                    alreadyPassed: true,
                    previousSubmission: {
                        percentage: existingSubmission.percentage,
                        certificateUrl: existingSubmission.certificateUrl,
                        submittedAt: existingSubmission.submittedAt
                    }
                });
            }
            
            // Vérifier la date de disponibilité
            const now = new Date();
            const availabilityDate = exam.availabilityDate || exam.startDate;
            if (now < availabilityDate) {
                return res.status(403).json({
                    success: false,
                    message: 'Cet examen n\'est pas encore disponible'
                });
            }
        }

        res.json({
            success: true,
            exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour un examen (ENSEIGNANT uniquement - propriétaire)
router.put('/:id', protect, teacher, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Examen non trouvé'
            });
        }

        // Vérifier que l'enseignant est le propriétaire
        if (exam.teacher.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de modifier cet examen'
            });
        }

        const { title, description, filiere, questions, duration, startDate, endDate, isPublished } = req.body;

        if (title) exam.title = title;
        if (description !== undefined) exam.description = description;
        if (filiere) exam.filiere = filiere;
        if (questions) exam.questions = questions;
        if (duration) exam.duration = duration;
        if (startDate) exam.startDate = startDate;
        if (endDate) exam.endDate = endDate;
        if (isPublished !== undefined) {
            exam.isPublished = isPublished;
            if (isPublished && !exam.publishedAt) {
                exam.publishedAt = new Date();
            }
        }

        await exam.save();

        const updatedExam = await Exam.findById(exam._id)
            .populate('teacher', 'username email teacherInfo')
            .populate('filiere', 'name code');

        res.json({
            success: true,
            message: 'Examen mis à jour avec succès',
            exam: updatedExam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer un examen (ENSEIGNANT uniquement - propriétaire)
router.delete('/:id', protect, teacher, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Examen non trouvé'
            });
        }

        // Vérifier que l'enseignant est le propriétaire
        if (exam.teacher.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de supprimer cet examen'
            });
        }

        // Supprimer aussi les soumissions associées
        await ExamSubmission.deleteMany({ exam: exam._id });
        await Exam.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Examen supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Soumettre un examen (ÉTUDIANT uniquement)
router.post('/:id/submit', protect, async (req, res) => {
    try {
        const { answers } = req.body;
        const examId = req.params.id;

        // Vérifier que c'est un étudiant
        if (req.userRole !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Seuls les étudiants peuvent soumettre un examen'
            });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Examen non trouvé'
            });
        }

        // Vérifier que l'examen est publié
        if (!exam.isPublished) {
            return res.status(403).json({
                success: false,
                message: 'Cet examen n\'est pas encore publié'
            });
        }

        // Vérifier les dates - utiliser availabilityDate au lieu de startDate
        const now = new Date();
        if (now < exam.availabilityDate) {
            return res.status(400).json({
                success: false,
                message: 'L\'examen n\'est pas encore disponible'
            });
        }
        if (now > exam.endDate) {
            return res.status(400).json({
                success: false,
                message: 'L\'examen est terminé'
            });
        }

        // Vérifier si l'étudiant a déjà passé cet examen
        const existingSubmission = await ExamSubmission.findOne({ 
            exam: examId, 
            student: req.userId 
        });

        // Si l'étudiant a déjà réussi l'examen, ne pas permettre de le repasser
        if (existingSubmission && existingSubmission.isSubmitted && existingSubmission.passed) {
            return res.status(403).json({
                success: false,
                message: 'Vous avez déjà réussi cet examen. Vous ne pouvez pas le repasser.',
                alreadyPassed: true,
                previousScore: existingSubmission.percentage,
                certificateUrl: existingSubmission.certificateUrl
            });
        }

        // Calculer le score
        let score = 0;
        const answerArray = answers || [];

        exam.questions.forEach((question, index) => {
            const studentAnswer = answerArray[index];
            if (!studentAnswer) return;

            if (question.type === 'multiple_choice') {
                const correctOption = question.options.find(opt => opt.isCorrect);
                if (correctOption && studentAnswer === correctOption.text) {
                    score += question.points || 1;
                }
            } else if (question.type === 'true_false' || question.type === 'text') {
                if (studentAnswer === question.correctAnswer) {
                    score += question.points || 1;
                }
            }
        });

        const percentage = exam.totalPoints > 0 ? (score / exam.totalPoints) * 100 : 0;
        const passed = percentage >= (exam.minPassingScore || 50);

        // Créer ou mettre à jour la soumission
        let submission = await ExamSubmission.findOne({ exam: examId, student: req.userId });

        if (submission) {
            submission.answers = answerArray.map((answer, index) => ({
                questionId: exam.questions[index]._id,
                answer: answer
            }));
            submission.score = score;
            submission.totalPoints = exam.totalPoints;
            submission.percentage = percentage;
            submission.submittedAt = new Date();
            submission.isSubmitted = true;
            submission.passed = passed;
        } else {
            submission = await ExamSubmission.create({
                exam: examId,
                student: req.userId,
                answers: answerArray.map((answer, index) => ({
                    questionId: exam.questions[index]._id,
                    answer: answer
                })),
                score,
                totalPoints: exam.totalPoints,
                percentage,
                submittedAt: new Date(),
                isSubmitted: true,
                passed: passed
            });
        }

        await submission.save();

        // Générer le certificat si l'étudiant a réussi
        let certificateUrl = null;
        if (passed && !submission.certificateGenerated) {
            try {
                const User = require('../models/User');
                const Filiere = require('../models/Filiere');
                const student = await User.findById(req.userId).populate('studentInfo.filiere');
                const teacher = await User.findById(exam.teacher);
                const filiere = await Filiere.findById(exam.filiere);

                certificateUrl = await generateCertificate({
                    studentName: `${student.studentInfo?.firstName || ''} ${student.studentInfo?.lastName || ''}`.trim() || student.username,
                    filiereName: filiere?.name || 'N/A',
                    examTitle: exam.title,
                    score: percentage.toFixed(2),
                    teacherName: `${teacher.teacherInfo?.firstName || ''} ${teacher.teacherInfo?.lastName || ''}`.trim() || teacher.username,
                    date: new Date().toLocaleDateString('fr-FR'),
                    submissionId: submission._id.toString()
                });

                submission.certificateUrl = certificateUrl;
                submission.certificateGenerated = true;
                await submission.save();
            } catch (certError) {
                console.error('Erreur lors de la génération du certificat:', certError);
                // Ne pas bloquer la soumission si la génération du certificat échoue
            }
        }

        res.json({
            success: true,
            message: 'Examen soumis avec succès',
            submission: {
                id: submission._id,
                score,
                totalPoints: exam.totalPoints,
                percentage: percentage.toFixed(2),
                passed: passed,
                certificateUrl: certificateUrl || submission.certificateUrl || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les résultats d'un examen (ÉTUDIANT - ses propres résultats)
router.get('/:id/results', protect, async (req, res) => {
    try {
        const examId = req.params.id;

        if (req.userRole === 'student') {
            const submission = await ExamSubmission.findOne({ exam: examId, student: req.userId })
                .populate('exam', 'title totalPoints');

            if (!submission) {
                return res.json({
                    success: true,
                    hasSubmission: false,
                    message: 'Vous n\'avez pas encore soumis cet examen'
                });
            }

            return res.json({
                success: true,
                hasSubmission: true,
                submission
            });
        } else if (req.userRole === 'teacher') {
            // Pour les enseignants, retourner tous les résultats avec statistiques
            const exam = await Exam.findById(examId)
                .populate('filiere', 'name code');
            
            if (!exam || exam.teacher.toString() !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous n\'avez pas la permission de voir ces résultats'
                });
            }

            const submissions = await ExamSubmission.find({ exam: examId, isSubmitted: true })
                .populate({
                    path: 'student',
                    select: 'username email studentInfo',
                    populate: {
                        path: 'studentInfo.filiere',
                        select: 'name code'
                    }
                })
                .sort({ submittedAt: -1 });

            // Préparer les données enrichies
            const enrichedSubmissions = submissions.map(submission => {
                const student = submission.student;
                const studentFiliere = student.studentInfo?.filiere;
                const fullName = student.studentInfo?.firstName && student.studentInfo?.lastName
                    ? `${student.studentInfo.firstName} ${student.studentInfo.lastName}`
                    : student.username;

                return {
                    _id: submission._id,
                    student: {
                        _id: student._id,
                        fullName: fullName,
                        username: student.username,
                        email: student.email,
                        filiere: studentFiliere ? {
                            _id: studentFiliere._id,
                            name: studentFiliere.name,
                            code: studentFiliere.code
                        } : null
                    },
                    score: submission.score,
                    totalPoints: submission.totalPoints,
                    percentage: submission.percentage,
                    passed: submission.passed,
                    submittedAt: submission.submittedAt,
                    startedAt: submission.startedAt
                };
            });

            // Calculer les statistiques
            const totalSubmissions = enrichedSubmissions.length;
            const passedCount = enrichedSubmissions.filter(s => s.passed).length;
            const failedCount = totalSubmissions - passedCount;
            
            const percentages = enrichedSubmissions.map(s => s.percentage);
            const averageScore = percentages.length > 0
                ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length
                : 0;
            const highestScore = percentages.length > 0 ? Math.max(...percentages) : 0;
            const lowestScore = percentages.length > 0 ? Math.min(...percentages) : 0;

            res.json({
                success: true,
                exam: {
                    _id: exam._id,
                    title: exam.title,
                    filiere: exam.filiere,
                    minPassingScore: exam.minPassingScore
                },
                count: totalSubmissions,
                submissions: enrichedSubmissions,
                statistics: {
                    totalSubmissions,
                    passedCount,
                    failedCount,
                    averageScore: parseFloat(averageScore.toFixed(2)),
                    highestScore: parseFloat(highestScore.toFixed(2)),
                    lowestScore: parseFloat(lowestScore.toFixed(2))
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

