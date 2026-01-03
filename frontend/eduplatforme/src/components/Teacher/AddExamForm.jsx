import React, { useState, useEffect } from 'react';
import { examService } from '../../services/examService';
import { X, Plus, Trash2 } from 'lucide-react';

const AddExamForm = ({ filieres, exam, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    filiere: '',
    duration: 60,
    startDate: '',
    endDate: '',
    availabilityDate: '',
    minPassingScore: 50,
    isPublished: false,
    questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        filiere: exam.filiere?._id || exam.filiere || '',
        duration: exam.duration || 60,
        startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '',
        endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '',
        availabilityDate: exam.availabilityDate ? new Date(exam.availabilityDate).toISOString().slice(0, 16) : '',
        minPassingScore: exam.minPassingScore || 50,
        isPublished: exam.isPublished || false,
        questions: exam.questions || [],
      });
    }
  }, [exam]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          type: 'multiple_choice',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          points: 1,
        },
      ],
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      if (field === 'isCorrect') {
        // Décocher toutes les autres options
        newQuestions[questionIndex].options = newQuestions[questionIndex].options.map((opt, idx) => ({
          ...opt,
          isCorrect: idx === optionIndex,
        }));
      } else {
        newQuestions[questionIndex].options[optionIndex] = {
          ...newQuestions[questionIndex].options[optionIndex],
          [field]: value,
        };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  const handleDeleteQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.questions.length === 0) {
      setError('Veuillez ajouter au moins une question');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        availabilityDate: formData.availabilityDate ? new Date(formData.availabilityDate).toISOString() : new Date(formData.startDate).toISOString(),
      };

      let result;
      if (exam) {
        result = await examService.updateExam(exam._id, submitData);
      } else {
        result = await examService.createExam(submitData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {exam ? 'Modifier l\'examen' : 'Créer un examen'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre de l'examen *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="filiere" className="block text-sm font-medium text-gray-700 mb-1">
              Filière *
            </label>
            <select
              id="filiere"
              name="filiere"
              value={formData.filiere}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Sélectionner une filière</option>
              {filieres
                .filter((f) => f.isActive)
                .map((filiere) => (
                  <option key={filiere._id} value={filiere._id}>
                    {filiere.code} - {filiere.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Durée (minutes) *
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="minPassingScore" className="block text-sm font-medium text-gray-700 mb-1">
              Note minimale pour réussir (%) *
            </label>
            <input
              type="number"
              id="minPassingScore"
              name="minPassingScore"
              value={formData.minPassingScore}
              onChange={handleChange}
              required
              min={0}
              max={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Note minimale en pourcentage pour obtenir le certificat</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="availabilityDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de disponibilité *
            </label>
            <input
              type="datetime-local"
              id="availabilityDate"
              name="availabilityDate"
              value={formData.availabilityDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Date à partir de laquelle les étudiants peuvent passer l'examen</p>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début *
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin *
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Questions ({formData.questions.length})
            </label>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              Ajouter une question
            </button>
          </div>

          {formData.questions.map((question, qIndex) => (
            <div key={qIndex} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-900">Question {qIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(qIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de question
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="multiple_choice">Choix multiples</option>
                      <option value="true_false">Vrai/Faux</option>
                      <option value="text">Texte libre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points *
                    </label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                      required
                      min={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {question.type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options (cochez la bonne réponse)
                    </label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name={`question-${qIndex}-correct`}
                          checked={option.isCorrect}
                          onChange={() => handleOptionChange(qIndex, oIndex, 'isCorrect', true)}
                          className="h-4 w-4 text-purple-600"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {(question.type === 'true_false' || question.type === 'text') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Réponse correcte *
                    </label>
                    <input
                      type="text"
                      value={question.correctAnswer || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                      required
                      placeholder={question.type === 'true_false' ? 'Vrai ou Faux' : 'Réponse attendue'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
            Publier immédiatement
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || formData.questions.length === 0}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sauvegarde...' : exam ? 'Mettre à jour' : 'Créer l\'examen'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExamForm;

