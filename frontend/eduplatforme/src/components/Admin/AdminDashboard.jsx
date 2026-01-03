import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { filiereService } from '../../services/filiereService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, GraduationCap, UserPlus, BookOpen, Plus, X } from 'lucide-react';
import AddFiliereForm from './AddFiliereForm';
import AddStudentForm from './AddStudentForm';
import AddTeacherForm from './AddTeacherForm';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFiliere, setShowAddFiliere] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les statistiques
      const statsResult = await adminService.getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      // Charger les filières
      const filieresResult = await filiereService.getAllFilieres(true);
      if (filieresResult.success) {
        setFilieres(filieresResult.filieres);
      }

      // Charger les étudiants
      const studentsResult = await adminService.getAllUsers('student');
      if (studentsResult.success) {
        setStudents(studentsResult.users);
      }

      // Charger les enseignants
      const teachersResult = await adminService.getAllUsers('teacher');
      if (teachersResult.success) {
        setTeachers(teachersResult.users);
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

  const handleFiliereAdded = async () => {
    setShowAddFiliere(false);
    setSuccessMessage('Filière ajoutée avec succès !');
    setTimeout(() => setSuccessMessage(''), 3000);
    await loadDashboardData();
  };

  const handleStudentAdded = async () => {
    setShowAddStudent(false);
    setSuccessMessage('Étudiant ajouté avec succès !');
    setTimeout(() => setSuccessMessage(''), 3000);
    await loadDashboardData();
  };

  const handleTeacherAdded = async () => {
    setShowAddTeacher(false);
    setSuccessMessage('Enseignant ajouté avec succès !');
    setTimeout(() => setSuccessMessage(''), 3000);
    await loadDashboardData();
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
              <p className="text-sm text-gray-500">Bienvenue, {user?.username || user?.email}</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Étudiants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enseignants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <GraduationCap className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Filières</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFilieres || 0}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <BookOpen className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers || 0}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <UserPlus className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => {
              setShowAddFiliere(true);
              setShowAddStudent(false);
              setShowAddTeacher(false);
            }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Plus className="text-purple-600" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ajouter une filière</h3>
                <p className="text-sm text-gray-500">Créer une nouvelle filière d'enseignement</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAddStudent(true);
              setShowAddFiliere(false);
              setShowAddTeacher(false);
            }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-lg group-hover:bg-blue-200 transition-colors">
                <UserPlus className="text-blue-600" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ajouter un étudiant</h3>
                <p className="text-sm text-gray-500">Créer un nouveau compte étudiant</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAddTeacher(true);
              setShowAddFiliere(false);
              setShowAddStudent(false);
            }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-lg group-hover:bg-green-200 transition-colors">
                <GraduationCap className="text-green-600" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ajouter un enseignant</h3>
                <p className="text-sm text-gray-500">Créer un nouveau compte enseignant</p>
              </div>
            </div>
          </button>
        </div>

        {/* Formulaires */}
        {showAddFiliere && (
          <div className="mb-8">
            <AddFiliereForm
              onSuccess={handleFiliereAdded}
              onCancel={() => setShowAddFiliere(false)}
            />
          </div>
        )}

        {showAddStudent && (
          <div className="mb-8">
            <AddStudentForm
              filieres={filieres}
              onSuccess={handleStudentAdded}
              onCancel={() => setShowAddStudent(false)}
            />
          </div>
        )}

        {showAddTeacher && (
          <div className="mb-8">
            <AddTeacherForm
              onSuccess={handleTeacherAdded}
              onCancel={() => setShowAddTeacher(false)}
            />
          </div>
        )}

        {/* Liste des filières */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Filières</h2>
          </div>
          <div className="p-6">
            {filieres.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune filière trouvée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durée (ans)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filieres.map((filiere) => (
                      <tr key={filiere._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {filiere.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {filiere.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {filiere.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {filiere.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              filiere.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {filiere.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Liste des étudiants */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Étudiants</h2>
          </div>
          <div className="p-6">
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun étudiant trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom d'utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom complet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filière
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro étudiant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentInfo?.firstName && student.studentInfo?.lastName
                            ? `${student.studentInfo.firstName} ${student.studentInfo.lastName}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentInfo?.filiere?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentInfo?.studentNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {student.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Liste des enseignants */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Enseignants</h2>
          </div>
          <div className="p-6">
            {teachers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun enseignant trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom d'utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom complet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spécialisation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro enseignant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Téléphone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teachers.map((teacher) => (
                      <tr key={teacher._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {teacher.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.teacherInfo?.firstName && teacher.teacherInfo?.lastName
                            ? `${teacher.teacherInfo.firstName} ${teacher.teacherInfo.lastName}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.teacherInfo?.specialization || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.teacherInfo?.teacherNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.teacherInfo?.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              teacher.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {teacher.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

