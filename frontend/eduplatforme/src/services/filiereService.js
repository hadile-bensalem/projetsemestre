import api from '../config/api';

export const filiereService = {
  // Récupérer toutes les filières
  getAllFilieres: async (isActive = null) => {
    try {
      const params = {};
      if (isActive !== null) {
        params.isActive = isActive;
      }
      const response = await api.get('/filieres', { params });
      return {
        success: true,
        filieres: response.data.filieres || response.data.data || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des filières',
      };
    }
  },

  // Récupérer une filière par ID
  getFiliereById: async (id) => {
    try {
      const response = await api.get(`/filieres/${id}`);
      return {
        success: true,
        filiere: response.data.filiere || response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération de la filière',
      };
    }
  },

  // Créer une filière
  createFiliere: async (filiereData) => {
    try {
      const response = await api.post('/filieres', filiereData);
      return {
        success: true,
        message: response.data.message || 'Filière créée avec succès',
        filiere: response.data.filiere || response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création de la filière',
      };
    }
  },

  // Mettre à jour une filière
  updateFiliere: async (id, filiereData) => {
    try {
      const response = await api.put(`/filieres/${id}`, filiereData);
      return {
        success: true,
        message: response.data.message || 'Filière mise à jour avec succès',
        filiere: response.data.filiere || response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour de la filière',
      };
    }
  },

  // Supprimer une filière
  deleteFiliere: async (id) => {
    try {
      const response = await api.delete(`/filieres/${id}`);
      return {
        success: true,
        message: response.data.message || 'Filière supprimée avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la suppression de la filière',
      };
    }
  },
};

