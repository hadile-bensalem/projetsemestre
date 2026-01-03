import api from '../config/api';

export const adminService = {
  // Créer un étudiant
  createStudent: async (studentData) => {
    try {
      const response = await api.post('/admin/create-student', studentData);
      return {
        success: true,
        message: response.data.message || 'Étudiant créé avec succès',
        student: response.data.student || response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création de l\'étudiant',
      };
    }
  },

  // Récupérer les statistiques du dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      return {
        success: true,
        stats: response.data.stats || response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des statistiques',
      };
    }
  },

  // Créer un enseignant
  createTeacher: async (teacherData) => {
    try {
      const response = await api.post('/admin/create-teacher', teacherData);
      return {
        success: true,
        message: response.data.message || 'Enseignant créé avec succès',
        teacher: response.data.teacher || response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création de l\'enseignant',
      };
    }
  },

  // Récupérer tous les utilisateurs
  getAllUsers: async (role = null, isActive = null) => {
    try {
      const params = {};
      if (role) params.role = role;
      if (isActive !== null) params.isActive = isActive;
      
      const response = await api.get('/admin/users', { params });
      return {
        success: true,
        users: response.data.users || response.data.data || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des utilisateurs',
      };
    }
  },
};

