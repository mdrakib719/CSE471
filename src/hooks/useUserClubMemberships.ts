import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  detailed_role?: string;
  joined_at: string;
  status: string;
  club: {
    id: string;
    name: string;
    description: string;
    club_image_url?: string;
    club_logo_url?: string;
    category: string;
  };
}

export const useUserClubMemberships = (userId?: string) => {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubMemberships = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching club memberships for user:', userId);
        
        // First try to get from club_memberships table
        let { data, error: fetchError } = await supabase
          .from('club_memberships')
          .select(`
            id,
            club_id,
            user_id,
            role,
            detailed_role,
            joined_at,
            status
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('joined_at', { ascending: false });

        console.log('📊 club_memberships result:', { data, error: fetchError });

        // If no data from club_memberships, try to get from approved applications
        if (!data || data.length === 0) {
          console.log('🔄 No memberships found, trying approved applications...');
          
          const { data: approvedApps, error: appsError } = await supabase
            .from('club_membership_application')
            .select(`
              id,
              club_id,
              applicant_id,
              status,
              application_date
            `)
            .eq('applicant_id', userId)
            .eq('status', 'approved')
            .order('application_date', { ascending: false });

          console.log('📊 approved applications result:', { approvedApps, error: appsError });

          if (!appsError && approvedApps && approvedApps.length > 0) {
            // Get club details separately to avoid foreign key issues
            const clubIds = approvedApps.map(app => app.club_id);
            const { data: clubsData, error: clubsError } = await supabase
              .from('clubs')
              .select('id, name, description, club_image_url, club_logo_url, category')
              .in('id', clubIds);

            console.log('📊 clubs data result:', { clubsData, error: clubsError });

            if (!clubsError && clubsData) {
              // Create a map of club_id to club data
              const clubsMap = new Map();
              clubsData.forEach(club => {
                clubsMap.set(club.id, club);
              });

              // Transform approved applications to match membership format
              data = approvedApps.map(app => ({
                id: app.id,
                club_id: app.club_id,
                user_id: app.applicant_id, // Use applicant_id directly
                role: 'Member',
                detailed_role: 'Active Member',
                joined_at: app.application_date, // Use application_date directly
                status: 'active',
                club: clubsMap.get(app.club_id) || {
                  id: app.club_id,
                  name: 'Unknown Club',
                  description: '',
                  club_image_url: null,
                  club_logo_url: null,
                  category: ''
                }
              }));
              console.log('🔄 Transformed approved apps to memberships:', data);
            }
          }
        }

        // Get club details for memberships if we have data
        if (data && data.length > 0) {
          const clubIds = data.map(membership => membership.club_id);
          const { data: clubsData, error: clubsError } = await supabase
            .from('clubs')
            .select('id, name, description, club_image_url, club_logo_url, category')
            .in('id', clubIds);

          if (!clubsError && clubsData) {
            const clubsMap = new Map();
            clubsData.forEach(club => {
              clubsMap.set(club.id, club);
            });

            // Add club data to memberships
            data = data.map(membership => ({
              ...membership,
              club: clubsMap.get(membership.club_id) || {
                id: membership.club_id,
                name: 'Unknown Club',
                description: '',
                club_image_url: null,
                club_logo_url: null,
                category: ''
              }
            }));
          }
        }

        if (fetchError) {
          throw fetchError;
        }

        setMemberships(data || []);
      } catch (err) {
        console.error('Error fetching club memberships:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch club memberships');
        setMemberships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClubMemberships();
  }, [userId]);

  return { memberships, loading, error };
};
