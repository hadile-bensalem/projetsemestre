import React, { useState, useEffect } from 'react';
import { GraduationCap, User, Lock, Mail, Users, BookOpen, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { testBackendConnection } from '../../utils/apiTest';

const AuthPage = () => {
  const { login, registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backendConnected, setBackendConnected] = useState(null); // null = vérification en cours, true = connecté, false = non connecté
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  // Vérifier la connexion au backend au chargement
  useEffect(() => {
    const checkBackend = async () => {
      const result = await testBackendConnection();
      setBackendConnected(result.success);
      if (!result.success) {
        setError(result.message);
      }
    };
    checkBackend();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer les erreurs lors de la saisie
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password) {
        setError('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      if (!isLogin) {
        // Validation pour l'inscription
        if (!formData.name) {
          setError('Veuillez entrer votre nom complet');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setLoading(false);
          return;
        }

        // Inscription Admin uniquement (pour l'instant)
        if (userType === 'admin') {
          const result = await registerAdmin(formData.name, formData.email, formData.password);
          if (result.success) {
            setSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            // Conserver l'email pour faciliter la connexion
            const savedEmail = formData.email;
            // Réinitialiser le formulaire mais garder l'email
            setFormData({
              email: savedEmail,
              password: '',
              name: '',
              confirmPassword: ''
            });
            // Basculer vers la page de connexion après 2 secondes
            setTimeout(() => {
              setIsLogin(true);
              setSuccess('');
            }, 2000);
          } else {
            // Afficher le message exact du backend
            setError(result.message || "Erreur lors de l'inscription");
          }
        } else {
          // Pour les étudiants et enseignants, l'inscription doit être faite par un admin
          setError('L\'inscription pour les étudiants et enseignants doit être effectuée par un administrateur. Veuillez contacter votre établissement.');
        }
      } else {
        // Connexion
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setSuccess('Connexion réussie ! Redirection...');
          setTimeout(() => {
            // Rediriger selon le rôle
            const role = result.user.role;
            if (role === 'admin') {
              navigate('/admin/dashboard');
            } else if (role === 'teacher') {
              navigate('/teacher/dashboard');
            } else {
              navigate('/student/dashboard');
            }
          }, 1500);
        } else {
          // Afficher le message exact du backend
          setError(result.message || 'Erreur lors de la connexion');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError(err.message || err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    { id: 'student', label: 'Étudiant', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'teacher', label: 'Enseignant', icon: Users, color: 'from-green-500 to-green-600' },
    { id: 'admin', label: 'Administrateur', icon: Shield, color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Panel - Branding */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    <GraduationCap className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h1 className="text-4xl font-bold">EduPlatforme</h1>
                </div>
                
                <h2 className="text-3xl font-bold mb-4">
                  Bienvenue sur votre espace d'apprentissage
                </h2>
                
                <p className="text-lg text-white/90 mb-8">
                  Connectez-vous pour accéder à vos cours, suivre votre progression et interagir avec votre communauté éducative.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-white/90">Accès à des milliers de cours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-white/90">Communauté d'apprentissage active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-white/90">Plateforme sécurisée et fiable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="p-12">
              <div className="mb-8">
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                      isLogin
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                      !isLogin
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Inscription
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isLogin ? 'Connectez-vous' : 'Créer un compte'}
                </h3>
                <p className="text-gray-600">
                  {isLogin ? 'Accédez à votre compte' : 'Rejoignez notre communauté'}
                </p>
              </div>

              {/* User Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Je suis un(e)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {userTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setUserType(type.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          userType === type.id
                            ? 'border-indigo-600 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 mx-auto mb-2 ${
                            userType === type.id ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            userType === type.id ? 'text-indigo-600' : 'text-gray-600'
                          }`}
                        >
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Messages d'erreur et de succès */}
              {backendConnected === false && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-yellow-800">Backend non accessible</p>
                  </div>
                  <p className="text-sm text-yellow-700 ml-8">
                    Assurez-vous que le serveur backend est démarré sur <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:5000</code>
                  </p>
                  <p className="text-xs text-yellow-600 ml-8 mt-2">
                    Commandes : <code className="bg-yellow-100 px-2 py-1 rounded">cd backend</code> puis <code className="bg-yellow-100 px-2 py-1 rounded">npm start</code>
                  </p>
                </div>
              )}

              {error && backendConnected !== false && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                        placeholder="Votre nom complet"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      placeholder="exemple@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                        placeholder="••••••••"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                    </label>
                    <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Mot de passe oublié?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner"></span>
                      {isLogin ? 'Connexion...' : 'Inscription...'}
                    </span>
                  ) : (
                    isLogin ? 'Se connecter' : "S'inscrire"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Vous n'avez pas de compte?" : 'Vous avez déjà un compte?'}{' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-indigo-600 font-semibold hover:text-indigo-700"
                  >
                    {isLogin ? "S'inscrire" : 'Se connecter'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>© 2024 EduPlatforme. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;