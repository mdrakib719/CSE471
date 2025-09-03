import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface PendingRegistration {
  user_id: string;
  email: string;
  full_name: string;
  student_id: string;
  department: string;
  registered_at: string;
  document_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
}

export const usePendingRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRegistrations = async () => {
    if (!user || user.role !== 'admin') {
      setError('Admin access required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_pending_registrations');

      if (error) throw error;

      setRegistrations(data || []);
    } catch (err: any) {
      console.error('Error fetching pending registrations:', err);
      setError(err.message || 'Failed to fetch pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const approveRegistration = async (userId: string, adminNotes?: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      setError('Admin access required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('approve_user_registration', {
        _user_id: userId,
        _admin_notes: adminNotes || null
      });

      if (error) throw error;

      if (data.success) {
        // Refresh the list
        await fetchPendingRegistrations();
        return true;
      } else {
        throw new Error(data.error || 'Failed to approve registration');
      }
    } catch (err: any) {
      console.error('Error approving registration:', err);
      setError(err.message || 'Failed to approve registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectRegistration = async (userId: string, adminNotes?: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      setError('Admin access required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('reject_user_registration', {
        _user_id: userId,
        _admin_notes: adminNotes || null
      });

      if (error) throw error;

      if (data.success) {
        // Refresh the list
        await fetchPendingRegistrations();
        return true;
      } else {
        throw new Error(data.error || 'Failed to reject registration');
      }
    } catch (err: any) {
      console.error('Error rejecting registration:', err);
      setError(err.message || 'Failed to reject registration');
      return false;
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchPendingRegistrations();
  }, [user]);

  return {
    registrations,
    loading,
    error,
    fetchPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    getStudentIdUrl
  };
};
