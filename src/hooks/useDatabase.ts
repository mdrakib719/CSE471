import { useState, useEffect } from "react";
import { supabase, type Event, type Club } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Custom hook for Events
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  // Create event
  const createEvent = async (
    eventData: Omit<Event, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    if (!user) throw new Error("User must be authenticated");

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          ...eventData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents((prev) => [...prev, data]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create event");
    }
  };

  // Update event
  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setEvents((prev) =>
        prev.map((event) => (event.id === id ? data : event))
      );
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update event");
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete event");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}

// Custom hook for Clubs
export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch clubs
  const fetchClubs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("useClubs - Fetched clubs:", data);
      setClubs(data || []);
    } catch (err) {
      console.error("useClubs - Error fetching clubs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clubs");
    } finally {
      setLoading(false);
    }
  };

  // Create club
  const createClub = async (
    clubData: Omit<Club, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    if (!user) throw new Error("User must be authenticated");

    try {
      const { data, error } = await supabase
        .from("clubs")
        .insert({
          ...clubData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setClubs((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create club");
    }
  };

  // Update club
  const updateClub = async (id: string, updates: Partial<Club>) => {
    try {
      const { data, error } = await supabase
        .from("clubs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setClubs((prev) => prev.map((club) => (club.id === id ? data : club)));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update club");
    }
  };

  // Delete club
  const deleteClub = async (id: string) => {
    try {
      const { error } = await supabase.from("clubs").delete().eq("id", id);

      if (error) throw error;

      setClubs((prev) => prev.filter((club) => club.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete club");
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  return {
    clubs,
    loading,
    error,
    createClub,
    updateClub,
    deleteClub,
    refetch: fetchClubs,
  };
}
