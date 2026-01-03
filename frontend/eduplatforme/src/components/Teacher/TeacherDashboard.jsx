import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { tpService } from '../../services/tpService';
import { examService } from '../../services/examService';
import { filiereService } from '../../services/filiereService';
import { LogOut, BookOpen, FileText, ClipboardList, Plus, X, Edit, Trash2, Eye, BarChart3 } from 'lucide-react';
import AddCourseForm from './AddCourseForm';
import AddTPForm from './AddTPForm';
import AddExamForm from './AddExamForm';
import ExamResults from './ExamResults';
import BIDashboard from './BIDashboard';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [tps, setTPs] = useState([]);
  const [exams, setExams] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddTP, setShowAddTP] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingTP, setEditingTP] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les filières
      const filieresResult = await filiereService.getAllFilieres(true);
      if (filieresResult.success) {
        setFilieres(filieresResult.filieres);
      }

      // Charger les cours de l'enseignant
      const coursesResult = await courseService.getAllCourses(null, null);
      if (coursesResult.success) {
        // Filtrer les cours de l'enseignant connecté
        const myCourses = coursesResult.courses.filter(course => course.teacher?._id === user?.id);
        setCourses(myCourses);
      }

      // Charger les TP de l'enseignant
      const tpsResult = await tpService.getAllTPs(null, null);
      if (tpsResult.success) {
        const myTPs = tpsResult.tps.filter(tp => tp.teacher?._id === user?.id);
        setTPs(myTPs);
      }

      // Charger les examens de l'enseignant
      const examsResult = await examService.getAllExams(null, null);
      if (examsResult.success) {
        const myExams = examsResult.exams.filter(exam => exam.teacher?._id === user?.id);
        setExams(myExams);
      }
    } catch (error) {
      setErrorMessage('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCourseAdded = async () => {
    setShowAddCourse(false);
    setEditingCourse(null);
    setSuccessMessage('Cours ajouté avec succès !');
    setTimeout(() => setSuccessMessage(''), 3000);
    await loadData();
  };

  const handleTPAdded = async () => {
    setShowAddTP(false);
    setEditingTP(null);
    setSuccessMessage('TP ajouté avec succès !');
    setTimeout(() => setSuccessMessage(''), 3000);
    await loadData();
  };

  const handleExamAdded = async () => {
    setShowAddExam(false);
    setEditingExam(null);
    setSuccessMessage('Examen ajouté avec succès !');
    setTimeout(() => setSuccessMessage(''), 3000);
    await loadData();
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    const result = await courseService.deleteCourse(courseId);
    if (result.success) {
      setSuccessMessage('Cours supprimé avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadData();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleDeleteTP = async (tpId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce TP ?')) return;

    const result = await tpService.deleteTP(tpId);
    if (result.success) {
      setSuccessMessage('TP supprimé avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadData();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) return;

    const result = await examService.deleteExam(examId);
    if (result.success) {
      setSuccessMessage('Examen supprimé avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadData();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleTogglePublish = async (type, id, currentStatus) => {
    try {
      if (type === 'course') {
        await courseService.updateCourse(id, { isPublished: !currentStatus });
      } else if (type === 'tp') {
        await tpService.updateTP(id, { isPublished: !currentStatus });
      } else if (type === 'exam') {
        await examService.updateExam(id, { isPublished: !currentStatus });
      }
      await loadData();
    } catch (error) {
      setErrorMessage('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Enseignant</h1>
              <p className="text-sm text-gray-500">
                Bienvenue, {user?.teacherInfo?.firstName || user?.username || user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('courses');
                setShowAddCourse(false);
                setShowAddTP(false);
                setShowAddExam(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={20} />
                Cours
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tps');
                setShowAddCourse(false);
                setShowAddTP(false);
                setShowAddExam(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                Travaux Pratiques
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('exams');
                setShowAddCourse(false);
                setShowAddTP(false);
                setShowAddExam(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={20} />
                Examens
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('results');
                setShowAddCourse(false);
                setShowAddTP(false);
                setShowAddExam(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={20} />
                Résultats des examens
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('bi-dashboard');
                setShowAddCourse(false);
                setShowAddTP(false);
                setShowAddExam(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bi-dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={20} />
                Analytics BI
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cours */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Mes Cours</h2>
              <button
                onClick={() => {
                  setShowAddCourse(true);
                  setEditingCourse(null);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Ajouter un cours
              </button>
            </div>

            {showAddCourse && (
              <div className="mb-6">
                <AddCourseForm
                  filieres={filieres}
                  course={editingCourse}
                  onSuccess={handleCourseAdded}
                  onCancel={() => {
                    setShowAddCourse(false);
                    setEditingCourse(null);
                  }}
                />
              </div>
            )}

            {courses.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun cours créé pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {course.isPublished ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Filière: {course.filiere?.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePublish('course', course._id, course.isPublished)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          course.isPublished
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {course.isPublished ? 'Dépublier' : 'Publier'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCourse(course);
                          setShowAddCourse(true);
                        }}
                        className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TP */}
        {activeTab === 'tps' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Mes Travaux Pratiques</h2>
              <button
                onClick={() => {
                  setShowAddTP(true);
                  setEditingTP(null);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                Ajouter un TP
              </button>
            </div>

            {showAddTP && (
              <div className="mb-6">
                <AddTPForm
                  filieres={filieres}
                  tp={editingTP}
                  onSuccess={handleTPAdded}
                  onCancel={() => {
                    setShowAddTP(false);
                    setEditingTP(null);
                  }}
                />
              </div>
            )}

            {tps.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun TP créé pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tps.map((tp) => (
                  <div key={tp._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{tp.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tp.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tp.isPublished ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    {tp.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tp.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Filière: {tp.filiere?.name}</p>
                      {tp.deadline && (
                        <p>Date limite: {new Date(tp.deadline).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePublish('tp', tp._id, tp.isPublished)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          tp.isPublished
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {tp.isPublished ? 'Dépublier' : 'Publier'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTP(tp);
                          setShowAddTP(true);
                        }}
                        className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTP(tp._id)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Examens */}
        {activeTab === 'exams' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Mes Examens</h2>
              <button
                onClick={() => {
                  setShowAddExam(true);
                  setEditingExam(null);
                }}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                Créer un examen
              </button>
            </div>

            {showAddExam && (
              <div className="mb-6">
                <AddExamForm
                  filieres={filieres}
                  exam={editingExam}
                  onSuccess={handleExamAdded}
                  onCancel={() => {
                    setShowAddExam(false);
                    setEditingExam(null);
                  }}
                />
              </div>
            )}

            {exams.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun examen créé pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {exams.map((exam) => {
                  const now = new Date();
                  const startDate = new Date(exam.startDate);
                  const endDate = new Date(exam.endDate);
                  const isAvailable = now >= startDate && now <= endDate;
                  const isUpcoming = now < startDate;
                  const isPast = now > endDate;

                  return (
                    <div key={exam._id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                          {exam.description && (
                            <p className="text-sm text-gray-600 mt-2">{exam.description}</p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            exam.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {exam.isPublished ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p className="font-medium">Filière</p>
                          <p>{exam.filiere?.name}</p>
                        </div>
                        <div>
                          <p className="font-medium">Durée</p>
                          <p>{exam.duration} minutes</p>
                        </div>
                        <div>
                          <p className="font-medium">Date de début</p>
                          <p>{new Date(exam.startDate).toLocaleString('fr-FR')}</p>
                        </div>
                        <div>
                          <p className="font-medium">Date de fin</p>
                          <p>{new Date(exam.endDate).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePublish('exam', exam._id, exam.isPublished)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            exam.isPublished
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {exam.isPublished ? 'Dépublier' : 'Publier'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingExam(exam);
                            setShowAddExam(true);
                          }}
                          className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Résultats des examens */}
        {activeTab === 'results' && (
          <div>
            <ExamResults />
          </div>
        )}

        {/* Analytics BI */}
        {activeTab === 'bi-dashboard' && (
          <div>
            <BIDashboard />
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;

