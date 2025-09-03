import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface UserEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  status: 'scheduled' | 'cancelled' | 'completed';
  registered_at: string;
  registration_status: 'registered' | 'cancelled' | 'waitlisted';
}

export function useUserEvents() {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserEvents = async () => {
    if (!user?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set user context for RLS
      await supabase.rpc('set_session_context', { user_id: user.id });

      // Fetch events that the user has registered for
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          status as registration_status,
          registered_at,
          events (
            id,
            title,
            description,
            start_at,
            end_at,
            location,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
        .limit(5); // Get recent 5 events

      if (error) throw error;

      // Transform the data to match our interface
      const userEvents: UserEvent[] = (data || [])
        .filter(reg => reg.events) // Filter out null events
        .map(reg => ({
          id: reg.events.id,
          title: reg.events.title,
          description: reg.events.description,
          start_at: reg.events.start_at,
          end_at: reg.events.end_at,
          location: reg.events.location,
          status: reg.events.status,
          registered_at: reg.registered_at,
          registration_status: reg.registration_status,
        }));

      setEvents(userEvents);
    } catch (err) {
      console.error('Error fetching user events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEvents();
  }, [user?.id]);

  return {
    events,
    loading,
    error,
    refetch: fetchUserEvents,
  };
}
