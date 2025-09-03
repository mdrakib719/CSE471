import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface StudentData {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  blood_group: BloodGroupType | null;
  phone_number: string | null;
  address: string | null;
  date_of_birth: string | null;
  admission_date: string;
  validity_date: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  emergency_contact: string | null;
  status: StudentStatus;
  profile_image_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

export interface CreateStudentData {
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  blood_group?: BloodGroupType;
  phone_number?: string;
  address?: string;
  date_of_birth?: string;
  admission_date?: string;
  validity_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  emergency_contact?: string;
  profile_image_url?: string;
  notes?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: StudentStatus;
}

export interface StudentStatistics {
  total_students: number;
  active_students: number;
  departments_count: number;
  recent_admissions: number;
}

// Custom hook for student data management
export function useStudentData() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set the current user context for admin access
      if (user?.id) {
        await supabase.rpc('set_session_context', { user_id: user.id });
      }

      const { data, error } = await supabase
        .from('student_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Create new student
  const createStudent = async (studentData: CreateStudentData) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Set the current user context for the session
    await supabase.rpc('set_session_context', { user_id: user.id });

    try {
      const { data, error } = await supabase.rpc('create_student_data', {
        p_student_id: studentData.student_id,
        p_full_name: studentData.full_name,
        p_email: studentData.email,
        p_department: studentData.department,
        p_blood_group: studentData.blood_group || null,
        p_phone_number: studentData.phone_number || null,
        p_address: studentData.address || null,
        p_date_of_birth: studentData.date_of_birth || null,
        p_admission_date: studentData.admission_date || null,
        p_validity_date: studentData.validity_date || null,
        p_guardian_name: studentData.guardian_name || null,
        p_guardian_phone: studentData.guardian_phone || null,
        p_emergency_contact: studentData.emergency_contact || null,
        p_profile_image_url: studentData.profile_image_url || null,
        p_notes: studentData.notes || null,
        p_created_by: user.id,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchStudents(); // Refresh the list
        return data;
      } else {
        throw new Error(data?.error || 'Failed to create student');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create student');
    }
  };

  // Update student
  const updateStudent = async (id: string, updates: UpdateStudentData) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Set the current user context for the session
    await supabase.rpc('set_session_context', { user_id: user.id });

    try {
      const { data, error } = await supabase.rpc('update_student_data', {
        p_id: id,
        p_student_id: updates.student_id || null,
        p_full_name: updates.full_name || null,
        p_email: updates.email || null,
        p_department: updates.department || null,
        p_blood_group: updates.blood_group || null,
        p_phone_number: updates.phone_number || null,
        p_address: updates.address || null,
        p_date_of_birth: updates.date_of_birth || null,
        p_admission_date: updates.admission_date || null,
        p_validity_date: updates.validity_date || null,
        p_guardian_name: updates.guardian_name || null,
        p_guardian_phone: updates.guardian_phone || null,
        p_emergency_contact: updates.emergency_contact || null,
        p_status: updates.status || null,
        p_profile_image_url: updates.profile_image_url || null,
        p_notes: updates.notes || null,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchStudents(); // Refresh the list
        return data;
      } else {
        throw new Error(data?.error || 'Failed to update student');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update student');
    }
  };

  // Delete student
  const deleteStudent = async (id: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Set the current user context for the session
    await supabase.rpc('set_session_context', { user_id: user.id });

    try {
      const { data, error } = await supabase.rpc('delete_student_data', {
        p_id: id
      });

      if (error) throw error;

      if (data?.success) {
        setStudents(prev => prev.filter(student => student.id !== id));
        return data;
      } else {
        throw new Error(data?.error || 'Failed to delete student');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete student');
    }
  };

  // Search students
  const searchStudents = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('student_data')
        .select('*')
        .or(`full_name.ilike.%${query}%,student_id.ilike.%${query}%,email.ilike.%${query}%,department.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error searching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  // Filter students by department
  const filterByDepartment = async (department: string) => {
    try {
      setLoading(true);
      setError(null);

      if (department === 'all') {
        await fetchStudents();
        return;
      }

      const { data, error } = await supabase
        .from('student_data')
        .select('*')
        .eq('department', department)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error filtering students:', err);
      setError(err instanceof Error ? err.message : 'Failed to filter students');
    } finally {
      setLoading(false);
    }
  };

  // Filter students by status
  const filterByStatus = async (status: StudentStatus | 'all') => {
    try {
      setLoading(true);
      setError(null);

      if (status === 'all') {
        await fetchStudents();
        return;
      }

      const { data, error } = await supabase
        .from('student_data')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error filtering students:', err);
      setError(err instanceof Error ? err.message : 'Failed to filter students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStudents();
    }
  }, [user]);

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    filterByDepartment,
    filterByStatus,
    refetch: fetchStudents,
  };
}

// Hook for student statistics
export function useStudentStatistics() {
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStatistics = async () => {
    if (!user || user.role !== 'admin') {
      setError('Admin access required');
      setLoading(false);
      return;
    }

    // Set the current user context for the session
    await supabase.rpc('set_session_context', { user_id: user.id });

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_student_statistics');

      if (error) throw error;

      if (data?.success) {
        setStatistics(data.statistics);
      } else {
        throw new Error(data?.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [user]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}
