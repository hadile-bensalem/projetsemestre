import api from '../config/api';

export const courseService = {
  // Récupérer tous les cours
  getAllCourses: async (filiere = null, isPublished = null) => {
    try {
      const params = {};
      if (filiere) params.filiere = filiere;
      if (isPublished !== null) params.isPublished = isPublished;
      
      const response = await api.get('/courses', { params });
      return {
        success: true,
        courses: response.data.courses || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des cours',
      };
    }
  },

  // Récupérer un cours par ID
  getCourseById: async (id) => {
    try {
      const response = await api.get(`/courses/${id}`);
      return {
        success: true,
        course: response.data.course,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération du cours',
      };
    }
  },

  // Créer un cours
  createCourse: async (courseData) => {
    try {
      console.log('[POST] Creation du cours:', courseData);
      const response = await api.post('/courses', courseData);
      console.log('[OK] Cours cree:', response.data);
      return {
        success: true,
        message: response.data.message || 'Cours créé avec succès',
        course: response.data.course,
      };
    } catch (error) {
      console.error('[ERREUR] Erreur creation cours:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création du cours',
      };
    }
  },

  // Mettre à jour un cours
  updateCourse: async (id, courseData) => {
    try {
      const response = await api.put(`/courses/${id}`, courseData);
      return {
        success: true,
        message: response.data.message || 'Cours mis à jour avec succès',
        course: response.data.course,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du cours',
      };
    }
  },

  // Supprimer un cours
  deleteCourse: async (id) => {
    try {
      const response = await api.delete(`/courses/${id}`);
      return {
        success: true,
        message: response.data.message || 'Cours supprimé avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la suppression du cours',
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

