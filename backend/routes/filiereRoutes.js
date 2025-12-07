const express = require('express');
const router = express.Router();
const Filiere = require('../models/Filiere');
const { protect, admin } = require('../middleware/authMiddleware');

// Créer une filière (ADMIN uniquement)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, code, description, duration, coordinator } = req.body;

        const filiereExists = await Filiere.findOne({ 
            $or: [{ name }, { code }] 
        });

        if (filiereExists) {
            return res.status(400).json({
                success: false,
                message: 'Filière avec ce nom ou code existe déjà'
            });
        }

        const filiere = await Filiere.create({
            name,
            code: code.toUpperCase(),
            description,
            duration,
            coordinator
        });

        const populatedFiliere = await Filiere.findById(filiere._id)
            .populate('coordinator', 'username email teacherInfo');

        res.status(201).json({
            success: true,
            message: 'Filière créée avec succès',
            filiere: populatedFiliere
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lire toutes les filières (ADMIN uniquement)
router.get('/', protect, admin, async (req, res) => {
    try {
        const filieres = await Filiere.find()
            .populate('coordinator', 'username email teacherInfo')
            .sort({ name: 1 });

        res.json({
            success: true,
            count: filieres.length,
            filieres
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lire une filière par ID (ADMIN uniquement)
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const filiere = await Filiere.findById(req.params.id)
            .populate('coordinator', 'username email teacherInfo');

        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
            });
        }

        res.json({
            success: true,
            filiere
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour une filière (ADMIN uniquement)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, code, description, duration, coordinator, isActive } = req.body;

        const filiere = await Filiere.findById(req.params.id);

        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
            });
        }

        if (name) filiere.name = name;
        if (code) filiere.code = code.toUpperCase();
        if (description !== undefined) filiere.description = description;
        if (duration) filiere.duration = duration;
        if (coordinator !== undefined) filiere.coordinator = coordinator;
        if (isActive !== undefined) filiere.isActive = isActive;

        await filiere.save();

        const updatedFiliere = await Filiere.findById(filiere._id)
            .populate('coordinator', 'username email teacherInfo');

        res.json({
            success: true,
            message: 'Filière mise à jour avec succès',
            filiere: updatedFiliere
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer une filière (ADMIN uniquement)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const filiere = await Filiere.findByIdAndDelete(req.params.id);

        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Filière supprimée avec succès',
            filiere: {
                id: filiere._id,
                name: filiere.name,
                code: filiere.code
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