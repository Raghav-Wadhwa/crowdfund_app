/**
 * Cloudinary Configuration
 *
 * Handles image uploads to Cloudinary for avatars and campaign images.
 * Uses backend upload for security (API keys stay server-side).
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log configuration status (without exposing secrets)
console.log('[Cloudinary] Config check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'NOT SET',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'NOT SET',
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the uploaded file
 * @param {string} folder - Cloudinary folder ('avatars' or 'campaigns')
 * @param {string} publicId - Unique identifier for the image
 * @returns {Promise<Object>} Cloudinary upload result with secure_url
 */
const uploadImage = async (filePath, folder, publicId) => {
  // Check if Cloudinary is properly configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('[Cloudinary] Missing configuration');
    return {
      success: false,
      error: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
    };
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `seedling/${folder}`,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      // Optional: Transformations for optimization
      transformation: [
        { width: folder === 'avatars' ? 400 : 1200, crop: 'limit' }, // Resize avatars to 400px, campaigns to 1200px
        { quality: 'auto:good' }, // Auto-optimize quality
        { fetch_format: 'auto' }, // Auto-select best format (webp, jpeg, etc.)
      ],
    });

    console.log(`[Cloudinary] Uploaded to ${folder}:`, result.secure_url);
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('[Cloudinary] Deleted:', publicId, result);
    return { success: true, result };
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Extract from URL pattern: .../seedling/folder/filename
    const matches = url.match(/\/seedling\/[^/]+\/(.+?)(?:\.[^.]+)?$/);
    return matches ? `seedling/${matches[0].replace('/', '')}` : null;
  } catch {
    return null;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  getPublicIdFromUrl,
};
