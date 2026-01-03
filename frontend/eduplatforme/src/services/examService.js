import api from '../config/api';

export const examService = {
  // Récupérer tous les examens
  getAllExams: async (filiere = null, isPublished = null) => {
    try {
      const params = {};
      if (filiere) params.filiere = filiere;
      if (isPublished !== null) params.isPublished = isPublished;
      
      const response = await api.get('/exams', { params });
      return {
        success: true,
        exams: response.data.exams || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des examens',
      };
    }
  },

  // Récupérer un examen par ID
  getExamById: async (id) => {
    try {
      const response = await api.get(`/exams/${id}`);
      return {
        success: true,
        exam: response.data.exam,
        alreadyPassed: response.data.alreadyPassed || false,
        previousSubmission: response.data.previousSubmission || null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération de l\'examen',
      };
    }
  },

  // Créer un examen
  createExam: async (examData) => {
    try {
      console.log('[POST] Creation de l\'examen:', examData);
      const response = await api.post('/exams', examData);
      console.log('[OK] Examen cree:', response.data);
      return {
        success: true,
        message: response.data.message || 'Examen créé avec succès',
        exam: response.data.exam,
      };
    } catch (error) {
      console.error('[ERREUR] Erreur creation examen:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création de l\'examen',
      };
    }
  },

  // Mettre à jour un examen
  updateExam: async (id, examData) => {
    try {
      const response = await api.put(`/exams/${id}`, examData);
      return {
        success: true,
        message: response.data.message || 'Examen mis à jour avec succès',
        exam: response.data.exam,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour de l\'examen',
      };
    }
  },

  // Supprimer un examen
  deleteExam: async (id) => {
    try {
      const response = await api.delete(`/exams/${id}`);
      return {
        success: true,
        message: response.data.message || 'Examen supprimé avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la suppression de l\'examen',
      };
    }
  },

  // Soumettre un examen
  submitExam: async (examId, answers) => {
    try {
      const response = await api.post(`/exams/${examId}/submit`, { answers });
      return {
        success: true,
        message: response.data.message || 'Examen soumis avec succès',
        submission: response.data.submission,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la soumission de l\'examen',
      };
    }
  },

  // Récupérer les résultats d'un examen
  getExamResults: async (examId) => {
    try {
      const response = await api.get(`/exams/${examId}/results`);
      return {
        success: true,
        hasSubmission: response.data.hasSubmission,
        submission: response.data.submission,
        submissions: response.data.submissions || [],
        exam: response.data.exam,
        statistics: response.data.statistics,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des résultats',
      };
    }
  },
};

