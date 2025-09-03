import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface StudentIdUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export const useStudentIdUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadStudentId = async (file: File, userId: string): Promise<StudentIdUploadResult> => {
    setUploading(true);
    setError(null);

    try {
      // Validate file size (200KB = 200 * 1024 bytes)
      const maxSize = 200 * 1024; // 200KB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 200KB');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `student-ids/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-ids')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      return {
        success: true,
        filePath: uploadData.path
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload student ID';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
    }
  };

  const getStudentIdUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('student-ids')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return data?.signedUrl || null;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  const deleteStudentId = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('student-ids')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      return false;
    }
  };

  return {
    uploadStudentId,
    getStudentIdUrl,
    deleteStudentId,
    uploading,
    error
  };
};
