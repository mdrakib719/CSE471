import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserData {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  role?: string;
  department?: string;
  student_id?: string;
  employee_id?: string;
}

export const useUserData = (userId: string) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            avatar_url,
            email,
            role,
            department,
            student_id,
            employee_id
          `)
          .eq('id', userId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return { userData, loading, error };
};

export const useMultipleUserData = (userIds: string[]) => {
  const [usersData, setUsersData] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsersData = async () => {
      if (!userIds.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            avatar_url,
            email,
            role,
            department,
            student_id,
            employee_id
          `)
          .in('id', userIds);

        if (fetchError) {
          throw fetchError;
        }

        // Convert array to object with id as key
        const usersMap = data.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, UserData>);

        setUsersData(usersMap);
      } catch (err) {
        console.error('Error fetching users data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch users data');
        setUsersData({});
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, [userIds.join(',')]);

  return { usersData, loading, error };
};
