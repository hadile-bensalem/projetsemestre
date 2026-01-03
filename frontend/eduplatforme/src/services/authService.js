import api from '../config/api';

// Service d'authentification
export const authService = {
  // Connexion
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      }, {
        timeout: 10000, // 10 secondes de timeout
      });
      return response.data;
    } catch (error) {
      // Gestion des erreurs réseau
      if (error.code === 'ECONNABORTED') {
        throw { message: 'La requête a pris trop de temps. Vérifiez votre connexion internet.', originalError: error };
      }
      
      if (error.message === 'Network Error' || !error.response) {
        throw { message: 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:5000', originalError: error };
      }
      
      // PRÉSERVER le message d'erreur du backend
      const errorData = error.response?.data;
      if (errorData && errorData.message) {
        throw { message: errorData.message, response: error.response };
      }
      throw { message: error.message || 'Erreur de connexion', originalError: error };
    }
  },

  // Inscription Admin (première fois uniquement)
  registerAdmin: async (username, email, password) => {
    try {
      const response = await api.post('/auth/register-admin', {
        username,
        email,
        password,
      }, {
        timeout: 10000, // 10 secondes de timeout
      });
      return response.data;
    } catch (error) {
      // Gestion des erreurs réseau
      if (error.code === 'ECONNABORTED') {
        throw { message: 'La requête a pris trop de temps. Vérifiez votre connexion internet.', originalError: error };
      }
      
      if (error.message === 'Network Error' || !error.response) {
        throw { message: 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:5000', originalError: error };
      }
      
      // PRÉSERVER le message d'erreur du backend - NE PAS LE MODIFIER
      const errorData = error.response?.data;
      if (errorData && errorData.message) {
        // Retourner le message exact du backend
        throw { message: errorData.message, response: error.response };
      }
      throw { message: error.message || "Erreur de connexion au serveur", originalError: error };
    }
  },

  // Créer un compte étudiant (nécessite authentification admin)
  createStudent: async (studentData) => {
    try {
      const response = await api.post('/admin/create-student', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la création de l'étudiant" };
    }
  },

  // Créer un compte enseignant (nécessite authentification admin)
  createTeacher: async (teacherData) => {
    try {
      const response = await api.post('/admin/create-teacher', teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de la création de l'enseignant" };
    }
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('token');
  },
};

