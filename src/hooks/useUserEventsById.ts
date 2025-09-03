import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  registered_at: string;
  registration_status: string;
}

export function useUserEventsById(userId?: string) {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching event registrations for user:', userId);
        
        // First get the user's email from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();
          
        if (userError || !userData?.email) {
          console.log('⚠️ Could not find user email for ID:', userId);
          setEvents([]);
          return;
        }
        
        console.log('📧 Found user email:', userData.email);
        
        // Now get the user's event registrations by email
        const { data: registrations, error: regError } = await supabase
          .from('event_registrations')
          .select(`
            id,
            user_id,
            event_id,
            registered_at,
            status,
            first_name,
            last_name,
            email,
            phone,
            dietary_requirements,
            emergency_contact
          `)
          .eq('email', userData.email)
          .order('registered_at', { ascending: false });

        console.log('📊 Event registrations result:', { registrations, error: regError });

        if (regError) {
          throw regError;
        }

        if (!registrations || registrations.length === 0) {
          console.log('🔄 No event registrations found for user:', userId);
          setEvents([]);
          return;
        }

        console.log('🔄 Creating events directly from registration data...');
        
        // Create events directly from registration data
        const formattedEvents: UserEvent[] = registrations.map(reg => {
          // Try to extract meaningful information from registration data
          const registrationDate = new Date(reg.registered_at);
          const formattedDate = registrationDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          
          // Try to build a meaningful title from registration data
          let title = `Event Registration (${formattedDate})`;
          if (reg.first_name && reg.last_name) {
            title = `${reg.first_name} ${reg.last_name} - ${formattedDate}`;
          }
          
          // Try to build description from available data
          let description = 'Event registration details';
          const details = [];
          if (reg.dietary_requirements) details.push(`Dietary: ${reg.dietary_requirements}`);
          if (reg.emergency_contact) details.push(`Emergency: ${reg.emergency_contact}`);
          if (reg.phone) details.push(`Phone: ${reg.phone}`);
          if (details.length > 0) {
            description = details.join(' • ');
          }
          
          return {
            id: reg.event_id,
            title: title,
            description: description,
            start_at: reg.registered_at,
            end_at: reg.registered_at,
            location: 'Location not available',
            registered_at: reg.registered_at,
            registration_status: reg.status || 'registered'
          };
        });
        
        console.log('🔄 Events created from registration data:', formattedEvents);
        setEvents(formattedEvents);
      } catch (err: any) {
        console.error('Error fetching user events by ID:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [userId]);

  return { events, loading, error };
}
