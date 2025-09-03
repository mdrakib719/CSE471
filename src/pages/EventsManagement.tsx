import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import EventsManager from "@/components/EventsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Users } from "lucide-react";

interface Club {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  type: string;
  category?: string;
  priority?: string;
  is_all_day?: boolean;
  club_id: string;
}

const EventsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's clubs
  useEffect(() => {
    const fetchClubs = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name, description, category')
          .or(`created_by.eq.${user.id},club_admin.eq.${user.id}`)
          .order('name');

        if (error) {
          console.error('Error fetching clubs:', error);
          toast({
            title: "Error",
            description: "Failed to fetch clubs",
            variant: "destructive",
          });
          return;
        }

        setClubs(data || []);
        if (data && data.length > 0) {
          setSelectedClub(data[0]);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast({
          title: "Error",
          description: "Failed to fetch clubs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [user, toast]);

  // Fetch events for selected club
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedClub) return;

      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('club_id', selectedClub.id)
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [selectedClub]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading events management...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Please sign in to manage events.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (clubs.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No Clubs Found</p>
              <p className="text-sm text-muted-foreground">
                You need to be a member or admin of a club to manage events.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Events Management</h1>
          <p className="text-muted-foreground">
            Create and manage events for your clubs
          </p>
        </div>

        {/* Club Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Club
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select
                value={selectedClub?.id || ""}
                onValueChange={(clubId) => {
                  const club = clubs.find(c => c.id === clubId);
                  setSelectedClub(club || null);
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{club.name}</span>
                        {club.category && (
                          <span className="text-xs text-muted-foreground">
                            {club.category}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedClub && (
                <div className="text-sm text-muted-foreground">
                  Managing events for: <span className="font-medium text-foreground">{selectedClub.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events Manager */}
        {selectedClub && (
          <EventsManager
            clubId={selectedClub.id}
            events={events}
            onEventsChange={setEvents}
          />
        )}
      </div>
    </Layout>
  );
};

export default EventsManagement;
