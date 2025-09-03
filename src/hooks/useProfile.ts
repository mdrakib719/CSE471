import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  department: string;
  student_id?: string;
  employee_id?: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  bio?: string;
  year?: string;
  gpa?: string;
  interests?: string[];
  clubs?: string[];
  achievements?: string[];
  date_of_birth?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  location: string; // Using location instead of address for UI consistency
  bio: string;
  department: string;
  year: string;
  gpa: string;
  interests: string[];
  clubs: string[];
  achievements: string[];
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  const loadProfile = async () => {
    if (!user?.id) return;

    // Don't load profile for admin users
    if (user?.role === 'admin') {
      setProfile(null);
      setError('Profile not available for administrators');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set user context for RLS (optional, will fallback gracefully)
      try {
        await supabase.rpc('set_session_context', { user_id: user.id });
      } catch (sessionError) {
        console.warn('Session context setting failed, continuing anyway:', sessionError);
      }

      // Get profile data
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_id: user.id
      });

      if (error) throw error;

      if (data?.success) {
        setProfile(data.data);
      } else {
        throw new Error(data?.error || 'Failed to load profile');
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (formData: ProfileFormData): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    // Don't allow profile updates for admin users
    if (user?.role === 'admin') {
      setError('Profile updates not allowed for administrators');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Set user context for RLS (optional, will fallback gracefully)
      try {
        await supabase.rpc('set_session_context', { user_id: user.id });
      } catch (sessionError) {
        console.warn('Session context setting failed, continuing anyway:', sessionError);
      }

      // Update profile using individual parameters with p_ prefix
      const { data, error } = await supabase.rpc('update_user_profile', {
        p_user_id: user.id,
        p_full_name: formData.name,
        p_phone: formData.phone,
        p_address: formData.location, // Map location to address for database
        p_bio: formData.bio,
        p_year: formData.year,
        p_gpa: formData.gpa,
        p_interests: formData.interests,
        p_clubs: formData.clubs,
        p_achievements: formData.achievements
      });

      if (error) throw error;

      if (data?.success) {
        // Reload profile data to get updated information
        await loadProfile();
        return true;
      } else {
        throw new Error(data?.error || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update avatar URL
  const updateAvatar = async (avatarUrl: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    // Don't allow avatar updates for admin users
    if (user?.role === 'admin') {
      setError('Avatar updates not allowed for administrators');
      return false;
    }

    try {
      // Set user context for RLS (optional, will fallback gracefully)
      try {
        await supabase.rpc('set_session_context', { user_id: user.id });
      } catch (sessionError) {
        console.warn('Session context setting failed, continuing anyway:', sessionError);
      }

      // Update avatar
      const { data, error } = await supabase.rpc('update_user_avatar', {
        user_id: user.id,
        avatar_url: avatarUrl
      });

      if (error) throw error;

      if (data?.success) {
        // Update local profile state
        if (profile) {
          setProfile({ ...profile, avatar_url: avatarUrl });
        }
        return true;
      } else {
        throw new Error(data?.error || 'Failed to update avatar');
      }
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      setError(err.message || 'Failed to update avatar');
      return false;
    }
  };

  // Convert profile data to form data
  const getFormData = (): ProfileFormData => {
    if (!profile) {
      return {
        name: user?.full_name || '',
        email: user?.email || '',
        phone: '',
        location: '',
        bio: '',
        department: user?.department || '',
        year: '',
        gpa: '',
        interests: [],
        clubs: [],
        achievements: []
      };
    }

    return {
      name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.address || '', // Map address to location for UI
      bio: profile.bio || '',
      department: profile.department || '',
      year: profile.year || '',
      gpa: profile.gpa || '',
      interests: profile.interests || [],
      clubs: profile.clubs || [],
      achievements: profile.achievements || []
    };
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    updateAvatar,
    getFormData
  };
} 