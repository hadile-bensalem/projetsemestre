import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';
import { Clock, CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react';
import api from '../../config/api';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadExam();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [examId]);

  useEffect(() => {
    if (isStarted && timeRemaining > 0 && !isSubmitted) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStarted, timeRemaining, isSubmitted]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const result = await examService.getExamById(examId);
      
      if (result.success) {
        const examData = result.exam;
        setExam(examData);
        
        // Vérifier si l'étudiant a déjà réussi (depuis la réponse de l'API)
        if (result.alreadyPassed && result.previousSubmission) {
          setIsSubmitted(true);
          setSubmissionResult({
            passed: true,
            percentage: result.previousSubmission.percentage,
            certificateUrl: result.previousSubmission.certificateUrl
          });
          setLoading(false);
          return;
        }
        
        // Vérifier si l'étudiant a déjà une soumission (pour les échecs)
        const submissionResult = await examService.getExamResults(examId);
        if (submissionResult.success && submissionResult.hasSubmission) {
          const submission = submissionResult.submission;
          setExistingSubmission(submission);
          
          // Si l'étudiant a déjà réussi, afficher le résultat
          if (submission.passed) {
            setIsSubmitted(true);
            setSubmissionResult({
              passed: true,
              percentage: submission.percentage,
              certificateUrl: submission.certificateUrl
            });
            setLoading(false);
            return;
          }
          // Si échoué, permettre de repasser
        }
        
        // Initialiser les réponses vides
        setAnswers(new Array(examData.questions.length).fill(''));
        
        // Vérifier si l'examen est disponible
        const now = new Date();
        const availabilityDate = new Date(examData.availabilityDate || examData.startDate);
        const endDate = new Date(examData.endDate);

        if (now < availabilityDate) {
          setError(`L'examen sera disponible à partir du ${availabilityDate.toLocaleString('fr-FR')}`);
        } else if (now > endDate) {
          setError('Cet examen est terminé');
        } else {
          // L'examen est disponible, on peut le démarrer
          setTimeRemaining(examData.duration * 60); // Convertir en secondes
        }
      } else {
        setError(result.message || 'Erreur lors du chargement de l\'examen');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement de l\'examen');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    setIsStarted(true);
    startTimeRef.current = new Date();
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleAutoSubmit = async () => {
    if (isSubmitted) return;
    await submitExam();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.confirm('Êtes-vous sûr de vouloir soumettre votre examen ? Cette action est irréversible.')) {
      await submitExam();
    }
  };

  const submitExam = async () => {
    if (isSubmitted || submitting) return;

    try {
      setSubmitting(true);
      const result = await examService.submitExam(examId, answers);

      if (result.success) {
        setIsSubmitted(true);
        setSubmissionResult(result.submission);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        setError(result.message || 'Erreur lors de la soumission');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la soumission de l\'examen');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadCertificate = () => {
    const certUrl = submissionResult?.certificateUrl || existingSubmission?.certificateUrl;
    if (certUrl) {
      // Le certificat est déjà dans le bon format depuis le backend (/api/certificates/...)
      // On doit construire l'URL complète
      const baseURL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const certificateUrl = certUrl.startsWith('http') ? certUrl : `${baseURL}${certUrl}`;
      console.log('Téléchargement certificat:', certificateUrl);
      window.open(certificateUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Chargement de l'examen...</p>
        </div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  // Écran de résultats après soumission
  if (isSubmitted && submissionResult) {
    const passed = submissionResult.passed;
    const percentage = parseFloat(submissionResult.percentage);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {passed ? (
              <>
                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Félicitations !</h2>
                <p className="text-xl text-gray-600 mb-6">
                  {existingSubmission ? 'Vous avez déjà réussi cet examen' : 'Vous avez réussi l\'examen'}
                </p>
                <div className="bg-green-50 rounded-lg p-6 mb-6">
                  <p className="text-2xl font-bold text-green-700 mb-2">
                    Note: {percentage.toFixed(2)}%
                  </p>
                  <p className="text-gray-600">
                    Note minimale requise: {exam.minPassingScore || 50}%
                  </p>
                </div>
                {existingSubmission && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Vous ne pouvez pas repasser cet examen car vous l'avez déjà réussi.
                    </p>
                  </div>
                )}
                {submissionResult.certificateUrl && (
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                      {existingSubmission 
                        ? 'Votre certificat de réussite est disponible ci-dessous.'
                        : 'Votre certificat de réussite a été généré automatiquement !'}
                    </p>
                    <button
                      onClick={downloadCertificate}
                      className="flex items-center justify-center gap-2 mx-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download size={20} />
                      Télécharger le certificat PDF
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle className="mx-auto text-red-500 mb-4" size={64} />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Examen échoué</h2>
                <p className="text-xl text-gray-600 mb-6">Vous n'avez pas atteint la note minimale requise</p>
                <div className="bg-red-50 rounded-lg p-6 mb-6">
                  <p className="text-2xl font-bold text-red-700 mb-2">
                    Note: {percentage.toFixed(2)}%
                  </p>
                  <p className="text-gray-600">
                    Note minimale requise: {exam.minPassingScore || 50}%
                  </p>
                </div>
              </>
            )}
            <div className="mt-8 pt-6 border-t">
              <button
                onClick={() => navigate('/student')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Écran de démarrage
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={() => navigate('/student')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft size={20} />
              Retour
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-600 mb-6">{exam.description}</p>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informations sur l'examen</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Durée:</span> {exam.duration} minutes</p>
                <p><span className="font-medium">Nombre de questions:</span> {exam.questions.length}</p>
                <p><span className="font-medium">Note minimale pour réussir:</span> {exam.minPassingScore || 50}%</p>
                <p><span className="font-medium">Points totaux:</span> {exam.totalPoints}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Une fois que vous commencez l'examen, le chronomètre démarre et ne peut pas être arrêté. 
                L'examen sera automatiquement soumis lorsque le temps sera écoulé.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <button
              onClick={handleStartExam}
              disabled={!!error}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Démarrer l'examen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interface de l'examen
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec chronomètre */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-500">
                Question {answers.filter(a => a !== '').length} / {exam.questions.length} répondues
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock size={20} />
                <span className="font-mono font-bold text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Soumission...' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu de l'examen */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {exam.questions.map((question, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {index + 1} ({question.points} point{question.points > 1 ? 's' : ''})
                  </h3>
                  <p className="text-gray-700">{question.question}</p>
                </div>

                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          answers[index] === option.text
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option.text}
                          checked={answers[index] === option.text}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          className="mr-3 h-4 w-4 text-purple-600"
                        />
                        <span className="text-gray-700">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(question.type === 'true_false' || question.type === 'text') && (
                  <input
                    type="text"
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={question.type === 'true_false' ? 'Vrai ou Faux' : 'Votre réponse'}
                  />
                )}
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeExam;

