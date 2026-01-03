const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Route pour uploader un fichier PDF
router.post('/pdf', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier téléchargé'
      });
    }

    // Construire l'URL du fichier
    const fileUrl = `/uploads/${req.file.filename}`;
    // Utiliser l'URL complète avec le port du backend
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullUrl = `${backendUrl}${fileUrl}`;

    res.json({
      success: true,
      message: 'Fichier téléchargé avec succès',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: fullUrl,
        localPath: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'upload du fichier'
    });
  }
});

// Route pour servir les fichiers uploadés
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;

