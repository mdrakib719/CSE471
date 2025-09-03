// Cloudinary configuration for client-side image uploads
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Helper function to upload image to Cloudinary
export const uploadImageToCloudinary = async (
  file: File,
  folder: string = 'profile-images'
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing. Please check your environment variables.');
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
      // Remove file extension
      return publicIdWithExtension.split('.')[0];
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Helper function to get optimized image URL with transformations
export const getOptimizedImageUrl = (url: string, width: number = 400, height: number = 400): string => {
  try {
    const publicId = extractPublicIdFromUrl(url);
    if (publicId) {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,g_face,f_auto/${publicId}`;
    }
    return url;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url;
  }
};
