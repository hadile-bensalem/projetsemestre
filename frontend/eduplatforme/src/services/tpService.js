import api from '../config/api';

export const tpService = {
  // Récupérer tous les TP
  getAllTPs: async (filiere = null, isPublished = null) => {
    try {
      const params = {};
      if (filiere) params.filiere = filiere;
      if (isPublished !== null) params.isPublished = isPublished;
      
      const response = await api.get('/tps', { params });
      return {
        success: true,
        tps: response.data.tps || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des TP',
      };
    }
  },

  // Récupérer un TP par ID
  getTPById: async (id) => {
    try {
      const response = await api.get(`/tps/${id}`);
      return {
        success: true,
        tp: response.data.tp,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération du TP',
      };
    }
  },

  // Créer un TP
  createTP: async (tpData) => {
    try {
      console.log('[POST] Creation du TP:', tpData);
      const response = await api.post('/tps', tpData);
      console.log('[OK] TP cree:', response.data);
      return {
        success: true,
        message: response.data.message || 'TP créé avec succès',
        tp: response.data.tp,
      };
    } catch (error) {
      console.error('[ERREUR] Erreur creation TP:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création du TP',
      };
    }
  },

  // Mettre à jour un TP
  updateTP: async (id, tpData) => {
    try {
      const response = await api.put(`/tps/${id}`, tpData);
      return {
        success: true,
        message: response.data.message || 'TP mis à jour avec succès',
        tp: response.data.tp,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du TP',
      };
    }
  },

  // Supprimer un TP
  deleteTP: async (id) => {
    try {
      const response = await api.delete(`/tps/${id}`);
      return {
        success: true,
        message: response.data.message || 'TP supprimé avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la suppression du TP',
      };
    }
  },

  // Uploader un fichier PDF
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        file: response.data.file,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'upload du fichier',
      };
    }
  },
};

