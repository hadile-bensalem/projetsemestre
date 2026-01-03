// Utilitaire pour tester la connexion au backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const testBackendConnection = async () => {
  try {
    // Tester directement la route racine du backend (sans /api)
    const response = await axios.get('http://localhost:5000/', {
      timeout: 5000,
    });
    return {
      success: true,
      message: 'Connexion au backend réussie',
      data: response.data
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Timeout : Le backend ne répond pas. Vérifiez qu\'il est démarré.'
      };
    }
      if (error.message === 'Network Error' || !error.response) {
        return {
          success: false,
          message: 'Le backend n\'est pas accessible. Vérifiez qu\'il est démarré sur http://localhost:5000. Le frontend tourne sur le port 3001.'
        };
      }
    return {
      success: false,
      message: error.message || 'Erreur de connexion'
    };
  }
};

