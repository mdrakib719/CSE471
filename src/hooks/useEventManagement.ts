import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  is_public: boolean;
  requires_approval: boolean;
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by: string;
  registrations_count?: number;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  is_public: boolean;
  requires_approval: boolean;
  status: 'draft' | 'published' | 'cancelled';
}

export const useEventManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_all_events_admin');
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Create new event
  const createEvent = async (eventData: CreateEventData): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('create_event_admin', {
        _title: eventData.title,
        _description: eventData.description,
        _category: eventData.category,
        _start_date: eventData.start_date,
        _start_time: eventData.start_time,
        _location: eventData.location,
        _created_by: user.id,
        _end_date: eventData.end_date || null,
        _end_time: eventData.end_time || null,
        _max_participants: eventData.max_participants || null,
        _registration_deadline: eventData.registration_deadline || null,
        _contact_person: eventData.contact_person || null,
        _contact_email: eventData.contact_email || null,
        _contact_phone: eventData.contact_phone || null,
        _is_public: eventData.is_public,
        _requires_approval: eventData.requires_approval,
        _status: eventData.status
      });

      if (error) throw error;

      await fetchEvents(); // Refresh the events list
      return data;
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update event
  const updateEvent = async (eventId: string, eventData: CreateEventData): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('update_event_admin', {
        _event_id: eventId,
        _title: eventData.title,
        _description: eventData.description,
        _category: eventData.category,
        _start_date: eventData.start_date,
        _start_time: eventData.start_time,
        _location: eventData.location,
        _user_id: user.id,
        _end_date: eventData.end_date || null,
        _end_time: eventData.end_time || null,
        _max_participants: eventData.max_participants || null,
        _registration_deadline: eventData.registration_deadline || null,
        _contact_person: eventData.contact_person || null,
        _contact_email: eventData.contact_email || null,
        _contact_phone: eventData.contact_phone || null,
        _is_public: eventData.is_public,
        _requires_approval: eventData.requires_approval,
        _status: eventData.status
      });

      if (error) throw error;

      await fetchEvents(); // Refresh the events list
      return data;
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('delete_event_admin', {
        _event_id: eventId,
        _user_id: user.id
      });

      if (error) throw error;

      await fetchEvents(); // Refresh the events list
      return data;
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Publish event (change status to published)
  const publishEvent = async (eventId: string): Promise<boolean> => {
    const event = events.find(e => e.id === eventId);
    if (!event) {
      setError('Event not found');
      return false;
    }

    return await updateEvent(eventId, {
      ...event,
      status: 'published'
    });
  };

  // Cancel event
  const cancelEvent = async (eventId: string): Promise<boolean> => {
    const event = events.find(e => e.id === eventId);
    if (!event) {
      setError('Event not found');
      return false;
    }

    return await updateEvent(eventId, {
      ...event,
      status: 'cancelled'
    });
  };

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    cancelEvent
  };
};

// Hook for public events (for regular users)
export const usePublicEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_published_events');
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching public events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  return {
    events,
    loading,
    error,
    fetchPublicEvents
  };
};

// Hook for event registration
export const useEventRegistration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerForEvent = async (eventId: string, notes?: string): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('register_for_event', {
        _event_id: eventId,
        _user_id: user.id,
        _notes: notes || null
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error registering for event:', err);
      setError('Failed to register for event');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserRegistrations = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_user_registrations', {
        _user_id: user.id
      });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching user registrations:', err);
      setError('Failed to fetch registrations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    registerForEvent,
    getUserRegistrations
  };
};
