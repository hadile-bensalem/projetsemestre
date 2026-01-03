import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { tpService } from '../../services/tpService';
import { examService } from '../../services/examService';
import { LogOut, BookOpen, FileText, ClipboardList, Download, Eye } from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [tps, setTPs] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Récupérer l'ID de la filière de l'étudiant
      // La filière peut être un objet avec _id ou directement un ObjectId (string)
      let filiereId = null;
      if (user?.studentInfo?.filiere) {
        if (typeof user.studentInfo.filiere === 'object' && user.studentInfo.filiere._id) {
          filiereId = user.studentInfo.filiere._id;
        } else {
          filiereId = user.studentInfo.filiere;
        }
      }

      console.log('[INFO] Chargement des donnees pour l\'etudiant - Filiere ID:', filiereId);

      // Charger les cours (le backend utilisera automatiquement la filière de l'étudiant)
      // On peut passer null pour laisser le backend gérer automatiquement
      const coursesResult = await courseService.getAllCourses(null, true);
      if (coursesResult.success) {
        console.log(`[OK] ${coursesResult.courses?.length || 0} cours charges`);
        setCourses(coursesResult.courses || []);
      } else {
        console.error('[ERREUR] Erreur chargement cours:', coursesResult.message);
        setErrorMessage(coursesResult.message || 'Erreur lors du chargement des cours');
      }

      // Charger les TP
      const tpsResult = await tpService.getAllTPs(null, true);
      if (tpsResult.success) {
        console.log(`[OK] ${tpsResult.tps?.length || 0} TP charges`);
        setTPs(tpsResult.tps || []);
      } else {
        console.error('[ERREUR] Erreur chargement TP:', tpsResult.message);
        setErrorMessage(tpsResult.message || 'Erreur lors du chargement des TP');
      }

      // Charger les examens
      const examsResult = await examService.getAllExams(null, true);
      if (examsResult.success) {
        console.log(`[OK] ${examsResult.exams?.length || 0} examens charges`);
        setExams(examsResult.exams || []);
      } else {
        console.error('[ERREUR] Erreur chargement examens:', examsResult.message);
        setErrorMessage(examsResult.message || 'Erreur lors du chargement des examens');
      }
    } catch (error) {
      console.error('[ERREUR] Erreur lors du chargement des donnees:', error);
      setErrorMessage('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewExam = (examId) => {
    navigate(`/student/exam/${examId}`);
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Étudiant</h1>
              <p className="text-sm text-gray-500">
                Bienvenue, {user?.studentInfo?.firstName || user?.username || user?.email}
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

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
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
              onClick={() => setActiveTab('tps')}
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
              onClick={() => setActiveTab('exams')}
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Cours */}
        {activeTab === 'courses' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cours Disponibles</h2>
            {courses.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun cours disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Enseignant: {course.teacher?.teacherInfo?.firstName} {course.teacher?.teacherInfo?.lastName}</p>
                      <p>Filière: {course.filiere?.name}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(course.fileUrl, course.fileName)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download size={18} />
                      Télécharger le PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TP */}
        {activeTab === 'tps' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Travaux Pratiques</h2>
            {tps.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun TP disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tps.map((tp) => (
                  <div key={tp._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tp.title}</h3>
                    {tp.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tp.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Enseignant: {tp.teacher?.teacherInfo?.firstName} {tp.teacher?.teacherInfo?.lastName}</p>
                      <p>Filière: {tp.filiere?.name}</p>
                      {tp.deadline && (
                        <p className="mt-2">
                          Date limite: {new Date(tp.deadline).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(tp.fileUrl, tp.fileName)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download size={18} />
                      Télécharger le TP
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Examens */}
        {activeTab === 'exams' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Examens Disponibles</h2>
            {exams.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun examen disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {exams.map((exam) => {
                  const now = new Date();
                  const startDate = new Date(exam.startDate);
                  const endDate = new Date(exam.endDate);
                  const isAvailable = now >= startDate && now <= endDate;
                  const isUpcoming = now < startDate;

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
                            isAvailable
                              ? 'bg-green-100 text-green-800'
                              : isUpcoming
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isAvailable ? 'Disponible' : isUpcoming ? 'À venir' : 'Terminé'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p className="font-medium">Enseignant</p>
                          <p>{exam.teacher?.teacherInfo?.firstName} {exam.teacher?.teacherInfo?.lastName}</p>
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
                      <button
                        onClick={() => handleViewExam(exam._id)}
                        disabled={!isAvailable}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isAvailable
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Eye size={18} />
                        {isAvailable ? 'Passer l\'examen' : isUpcoming ? 'Examen à venir' : 'Examen terminé'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;

