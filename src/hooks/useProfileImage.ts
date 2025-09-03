import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes

export function useProfileImage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const compressImage = (file: File, maxSizeKB: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions to maintain aspect ratio
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to get under size limit
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                // Convert blob to file
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setUploading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Compress image if needed
      let processedFile = file;
      if (file.size > MAX_FILE_SIZE) {
        try {
          processedFile = await compressImage(file, 100);
          if (processedFile.size > MAX_FILE_SIZE) {
            throw new Error('Image too large. Please select a smaller image or reduce quality.');
          }
        } catch (compressionError) {
          throw new Error('Failed to compress image. Please try a smaller file.');
        }
      }

      // Generate unique filename
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      // Update user profile with new avatar URL
      await updateUserAvatar(urlData.publicUrl);

      return urlData.publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Use unified RPC approach with p_ prefix parameters
    const { data, error } = await supabase.rpc('update_user_avatar', {
      p_user_id: user.id,
      p_avatar_url: avatarUrl
    });

    if (error) {
      throw new Error(`Failed to update avatar: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to update avatar');
    }
  };

  const deleteProfileImage = async (): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setUploading(true);
    setError(null);

    try {
      // Update profile to remove avatar URL
      await updateUserAvatar('');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setError(errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadProfileImage,
    deleteProfileImage,
    uploading,
    error,
    maxFileSize: MAX_FILE_SIZE,
  };
}
