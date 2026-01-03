import React, { useState, useEffect } from 'react';
import { examService } from '../../services/examService';
import { BarChart3, Users, CheckCircle, XCircle, TrendingUp, Award, AlertCircle } from 'lucide-react';

const ExamResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadResults(selectedExamId);
    }
  }, [selectedExamId]);

  const loadExams = async () => {
    try {
      const result = await examService.getAllExams(null, null);
      if (result.success) {
        setExams(result.exams);
        // Sélectionner le premier examen par défaut s'il y en a
        if (result.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(result.exams[0]._id);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des examens');
    }
  };

  const loadResults = async (examId) => {
    setLoading(true);
    setError('');
    try {
      const result = await examService.getExamResults(examId);
      if (result.success) {
        setResults(result);
      } else {
        setError(result.message || 'Erreur lors du chargement des résultats');
      }
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les soumissions selon les filtres
  const filteredSubmissions = results?.submissions?.filter(submission => {
    if (filterFiliere && submission.student.filiere?._id !== filterFiliere) {
      return false;
    }
    if (filterStatus === 'passed' && !submission.passed) {
      return false;
    }
    if (filterStatus === 'failed' && submission.passed) {
      return false;
    }
    return true;
  }) || [];

  // Récupérer les filières uniques des soumissions
  const uniqueFilieres = results?.submissions?.reduce((acc, submission) => {
    if (submission.student.filiere) {
      const filiereId = submission.student.filiere._id;
      if (!acc.find(f => f._id === filiereId)) {
        acc.push(submission.student.filiere);
      }
    }
    return acc;
  }, []) || [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedExam = exams.find(e => e._id === selectedExamId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Résultats des Examens</h2>
      </div>

      {/* Sélection d'examen */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un examen
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Sélectionner un examen --</option>
          {exams.map((exam) => (
            <option key={exam._id} value={exam._id}>
              {exam.title} - {exam.filiere?.name || 'N/A'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des résultats...</p>
        </div>
      )}

      {!loading && selectedExamId && results && (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total des soumissions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {results.statistics?.totalSubmissions || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Réussites</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {results.statistics?.passedCount || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Échecs</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {results.statistics?.failedCount || 0}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {results.statistics?.averageScore?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Note la plus haute</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {results.statistics?.highestScore?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Award className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Note la plus basse</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {results.statistics?.lowestScore?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <BarChart3 className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Informations de l'examen */}
          {results.exam && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de l'examen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Titre</p>
                  <p className="font-medium text-gray-900">{results.exam.title}</p>
                </div>
                <div>
                  <p className="text-gray-600">Filière</p>
                  <p className="font-medium text-gray-900">
                    {results.exam.filiere?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Note minimale pour réussir</p>
                  <p className="font-medium text-gray-900">
                    {results.exam.minPassingScore || 50}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filtres */}
          {results.submissions && results.submissions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filière
                  </label>
                  <select
                    value={filterFiliere}
                    onChange={(e) => setFilterFiliere(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les filières</option>
                    {uniqueFilieres.map((filiere) => (
                      <option key={filiere._id} value={filiere._id}>
                        {filiere.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="passed">Réussi</option>
                    <option value="failed">Échoué</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tableau des résultats */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Résultats des étudiants ({filteredSubmissions.length})
              </h3>
            </div>
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">
                  {results.submissions?.length === 0
                    ? "Aucun étudiant n'a encore passé cet examen"
                    : 'Aucun résultat ne correspond aux filtres sélectionnés'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Étudiant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filière
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de passage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.student.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.student.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.student.filiere?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(submission.submittedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.percentage?.toFixed(2) || '0.00'}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.score}/{submission.totalPoints} points
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              submission.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {submission.passed ? 'RÉUSSI' : 'ÉCHOUÉ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !selectedExamId && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">Veuillez sélectionner un examen pour voir les résultats</p>
        </div>
      )}
    </div>
  );
};

export default ExamResults;

