import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { X, Upload, File } from 'lucide-react';

const AddCourseForm = ({ filieres, course, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    filiere: '',
    fileUrl: '',
    fileName: '',
    fileType: 'application/pdf',
    isPublished: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        filiere: course.filiere?._id || course.filiere || '',
        fileUrl: course.fileUrl || '',
        fileName: course.fileName || '',
        fileType: course.fileType || 'application/pdf',
        isPublished: course.isPublished || false,
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont autorisés');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 10MB');
        return;
      }
      setSelectedFile(file);
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let fileUrl = formData.fileUrl;
      let fileName = formData.fileName;

      // Si un fichier est sélectionné, l'uploader d'abord
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await courseService.uploadFile(selectedFile);
        
        if (!uploadResult.success) {
          setError(uploadResult.message || 'Erreur lors de l\'upload du fichier');
          setLoading(false);
          setUploading(false);
          return;
        }

        fileUrl = uploadResult.file.fileUrl;
        fileName = uploadResult.file.originalName;
        setUploading(false);
      }

      // Validation : soit un fichier uploadé, soit une URL
      if (!fileUrl || !fileName) {
        setError('Veuillez sélectionner un fichier PDF ou fournir une URL');
        setLoading(false);
        return;
      }

      const courseData = {
        ...formData,
        fileUrl,
        fileName,
      };

      let result;
      if (course) {
        result = await courseService.updateCourse(course._id, courseData);
      } else {
        result = await courseService.createCourse(courseData);
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
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {course ? 'Modifier le cours' : 'Ajouter un cours'}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre du cours *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Introduction à la programmation"
          />
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
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Description du cours..."
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Upload de fichier */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Fichier PDF *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <File size={20} className="text-blue-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : formData.fileUrl ? (
                <div className="text-sm text-gray-600">
                  <p>URL actuelle: {formData.fileUrl}</p>
                  <p className="text-xs text-gray-500 mt-1">Ou sélectionnez un nouveau fichier</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Télécharger un fichier</span>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">ou glissez-déposez</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF jusqu'à 10MB</p>
                </>
              )}
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFormData((prev) => ({ ...prev, fileName: '' }));
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Supprimer le fichier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Option alternative : URL du fichier (pour compatibilité) */}
        {!selectedFile && (
          <div>
            <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Ou URL du fichier PDF
            </label>
            <input
              type="url"
              id="fileUrl"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/cours.pdf"
            />
            <p className="mt-1 text-xs text-gray-500">
              Si vous avez déjà une URL, vous pouvez l'utiliser à la place de l'upload
            </p>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
            Publier immédiatement
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? 'Upload en cours...'
              : loading
              ? 'Sauvegarde...'
              : course
              ? 'Mettre à jour'
              : 'Créer le cours'}
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

export default AddCourseForm;
