/**
 * Image Upload Component
 *
 * Handles image file selection and upload to Cloudinary via backend.
 * Shows preview, upload progress, and handles errors.
 */

import { useState, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({
  endpoint,           // API endpoint: '/upload/avatar' or '/upload/campaign/:id'
  currentImage,       // Current image URL (for preview)
  onUploadSuccess,    // Callback with new image URL
  onUploadError,      // Callback on error
  label = 'Upload Image',
  acceptedTypes = 'image/*',
  maxSizeMB = 5,
}) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (file) => {
    // Validate file
    if (!file) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Image uploaded successfully!');
        setPreview(response.data.url);
        onUploadSuccess?.(response.data.url);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload image';
      toast.error(message);
      onUploadError?.(error);
      // Reset preview to current image on error
      setPreview(currentImage || null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {preview ? (
        // Preview mode
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors mr-2"
              title="Remove image"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={triggerFileInput}
              disabled={loading}
              className="bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 transition-colors"
              title="Change image"
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        // Upload mode
        <div
          onClick={triggerFileInput}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${loading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleInputChange}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full mb-3">
                <ImageIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, WebP up to {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
