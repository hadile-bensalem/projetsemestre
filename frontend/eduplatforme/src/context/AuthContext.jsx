import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const loadUser = () => {
      const savedUser = authService.getCurrentUser();
      const token = authService.getToken();
      
      if (savedUser && token) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Connexion
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      } else {
        // PRÉSERVER le message du backend
        return { success: false, message: response.message || 'Erreur lors de la connexion' };
      }
    } catch (error) {
      // PRÉSERVER le message d'erreur du backend
      return {
        success: false,
        message: error.message || 'Erreur lors de la connexion',
      };
    }
  };

  // Inscription Admin (sans connexion automatique)
  const registerAdmin = async (username, email, password) => {
    try {
      const response = await authService.registerAdmin(username, email, password);
      
      if (response.success) {
        // Ne pas connecter automatiquement l'utilisateur après l'inscription
        // L'utilisateur devra se connecter manuellement
        return { success: true, message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' };
      } else {
        // PRÉSERVER le message exact du backend
        return { success: false, message: response.message || "Erreur lors de l'inscription" };
      }
    } catch (error) {
      // PRÉSERVER le message d'erreur du backend - NE PAS LE MODIFIER
      const errorMessage = error.message || error.response?.data?.message || "Erreur lors de l'inscription";
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Créer un étudiant (admin uniquement)
  const createStudent = async (studentData) => {
    try {
      const response = await authService.createStudent(studentData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erreur lors de la création de l'étudiant",
      };
    }
  };

  // Créer un enseignant (admin uniquement)
  const createTeacher = async (teacherData) => {
    try {
      const response = await authService.createTeacher(teacherData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erreur lors de la création de l'enseignant",
      };
    }
  };

  // Déconnexion
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    registerAdmin,
    createStudent,
    createTeacher,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

