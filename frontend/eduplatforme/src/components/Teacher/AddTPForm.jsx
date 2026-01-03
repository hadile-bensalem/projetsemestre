import React, { useState, useEffect } from 'react';
import { tpService } from '../../services/tpService';
import { X, Upload, File } from 'lucide-react';

const AddTPForm = ({ filieres, tp, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    filiere: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    fileType: 'application/pdf',
    deadline: '',
    isPublished: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tp) {
      setFormData({
        title: tp.title || '',
        description: tp.description || '',
        filiere: tp.filiere?._id || tp.filiere || '',
        fileUrl: tp.fileUrl || '',
        fileName: tp.fileName || '',
        fileSize: tp.fileSize || '',
        fileType: tp.fileType || 'application/pdf',
        deadline: tp.deadline ? new Date(tp.deadline).toISOString().split('T')[0] : '',
        isPublished: tp.isPublished || false,
      });
    }
  }, [tp]);

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
        fileSize: file.size,
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation : un fichier doit être sélectionné
      if (!selectedFile && !tp) {
        setError('Veuillez sélectionner un fichier PDF');
        setLoading(false);
        return;
      }

      let fileUrl = formData.fileUrl;
      let fileName = formData.fileName;
      let fileSize = formData.fileSize;

      // Si un fichier est sélectionné, l'uploader d'abord
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await tpService.uploadFile(selectedFile);
        
        if (!uploadResult.success) {
          setError(uploadResult.message || 'Erreur lors de l\'upload du fichier');
          setLoading(false);
          setUploading(false);
          return;
        }

        fileUrl = uploadResult.file.fileUrl;
        fileName = uploadResult.file.originalName;
        fileSize = uploadResult.file.size;
        setUploading(false);
      }

      // Si c'est une mise à jour et qu'aucun nouveau fichier n'est sélectionné, garder les valeurs existantes
      if (tp && !selectedFile) {
        fileUrl = formData.fileUrl;
        fileName = formData.fileName;
        fileSize = formData.fileSize;
      }

      const submitData = {
        ...formData,
        fileUrl,
        fileName,
        fileSize,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      };

      let result;
      if (tp) {
        result = await tpService.updateTP(tp._id, submitData);
      } else {
        result = await tpService.createTP(submitData);
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
          {tp ? 'Modifier le TP' : 'Ajouter un TP'}
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
            Titre du TP *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Ex: TP Algorithmes et structures de données"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Description du TP..."
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
            <div className="space-y-1 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <File size={20} className="text-green-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : tp && formData.fileUrl ? (
                <div className="text-sm text-gray-600">
                  <p>Fichier actuel: {formData.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">Sélectionnez un nouveau fichier pour le remplacer</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Télécharger un fichier</span>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                        required={!tp}
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
                    setFormData((prev) => ({ ...prev, fileName: '', fileSize: '' }));
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Supprimer le fichier
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
            Date limite
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
            Publier immédiatement
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Upload en cours...' : loading ? 'Sauvegarde...' : tp ? 'Mettre à jour' : 'Créer le TP'}
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

export default AddTPForm;

