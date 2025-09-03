import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock,
  MapPin,
  Edit,
  Save,
  X,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
}

interface EventsManagerProps {
  clubId: string;
  events: Event[];
  onEventsChange: (events: Event[]) => void;
}

const EventsManager: React.FC<EventsManagerProps> = ({
  clubId,
  events,
  onEventsChange
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    type: "event",
    category: "General",
    priority: "medium",
    is_all_day: false
  });

  const eventTypes = [
    "event", "deadline", "meeting", "exam", "holiday"
  ];

  const eventCategories = [
    "General", "Academic", "Social", "Sports", "Cultural", 
    "Career Services", "Student Life", "Administrative", "Other"
  ];

  const eventPriorities = [
    "low", "medium", "high"
  ];

  // Add new event
  const addEvent = async () => {
    if (!newEvent.title?.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      });
      return;
    }

    if (!newEvent.start_date) {
      toast({
        title: "Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }

    if (!newEvent.end_date) {
      toast({
        title: "Error",
        description: "End date is required",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add events",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding event with data:', {
        title: newEvent.title.trim(),
        description: newEvent.description?.trim() || null,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        start_time: newEvent.start_time || null,
        end_time: newEvent.end_time || null,
        location: newEvent.location?.trim() || null,
        type: newEvent.type || "event",
        category: newEvent.category || "General",
        priority: newEvent.priority || "medium",
        is_all_day: newEvent.is_all_day || false,
        created_by: user.id,
        club_id: clubId,
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: newEvent.title.trim(),
          description: newEvent.description?.trim() || null,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          start_time: newEvent.start_time || null,
          end_time: newEvent.end_time || null,
          location: newEvent.location?.trim() || null,
          type: newEvent.type || "event",
          category: newEvent.category || "General",
          priority: newEvent.priority || "medium",
          is_all_day: newEvent.is_all_day || false,
          created_by: user.id,
          club_id: clubId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding event:', error);
        toast({
          title: "Error",
          description: `Failed to add event: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      onEventsChange([...events, data]);
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        location: "",
        type: "event",
        category: "General",
        priority: "medium",
        is_all_day: false
      });
      
      toast({
        title: "Event Added",
        description: "Event has been added successfully",
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: `Failed to add event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Update event
  const updateEvent = async (eventId: string, updatedEvent: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: updatedEvent.title?.trim(),
          description: updatedEvent.description?.trim() || null,
          start_date: updatedEvent.start_date,
          end_date: updatedEvent.end_date,
          start_time: updatedEvent.start_time || null,
          end_time: updatedEvent.end_time || null,
          location: updatedEvent.location?.trim() || null,
          type: updatedEvent.type || "event",
          category: updatedEvent.category || "General",
          priority: updatedEvent.priority || "medium",
          is_all_day: updatedEvent.is_all_day || false,
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: `Failed to update event: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      onEventsChange(events.map(event => 
        event.id === eventId ? { ...event, ...updatedEvent } : event
      ));
      setEditingEvent(null);
      
      toast({
        title: "Event Updated",
        description: "Event has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: `Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: `Failed to delete event: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      onEventsChange(events.filter(event => event.id !== eventId));
      
      toast({
        title: "Event Deleted",
        description: "Event has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Separate events into upcoming and previous
  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.start_date) >= now);
  const previousEvents = events.filter(event => new Date(event.start_date) < now);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Events Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage club events and activities
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Event Form */}
        <Card className="border border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Event Title *</Label>
                <Input
                  id="event-title"
                  placeholder="e.g., Club Meeting"
                  value={newEvent.title || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <select
                  id="event-type"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={newEvent.type || "event"}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                placeholder="Describe the event..."
                value={newEvent.description || ""}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start-date">Start Date *</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={newEvent.start_date || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end-date">End Date *</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={newEvent.end_date || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start-time">Start Time</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={newEvent.start_time || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end-time">End Time</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={newEvent.end_time || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  placeholder="e.g., Room 101"
                  value={newEvent.location || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-category">Category</Label>
                <select
                  id="event-category"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={newEvent.category || "General"}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                >
                  {eventCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-priority">Priority</Label>
                <select
                  id="event-priority"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={newEvent.priority || "medium"}
                  onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                >
                  {eventPriorities.map(priority => (
                    <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="event-all-day"
                checked={newEvent.is_all_day || false}
                onChange={(e) => setNewEvent({ ...newEvent, is_all_day: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="event-all-day">All Day Event</Label>
            </div>

            <Button onClick={addEvent} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </CardContent>
        </Card>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events added yet</p>
            <p className="text-sm">Add your first event to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Upcoming Events ({upcomingEvents.length})</h3>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="border border-border/50">
                      <CardContent className="p-4">
                        {editingEvent === event.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                  value={event.title}
                                  onChange={(e) => {
                                    const updatedEvent = { ...event, title: e.target.value };
                                    onEventsChange(events.map(ev => ev.id === event.id ? updatedEvent : ev));
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                                  value={event.type}
                                  onChange={(e) => {
                                    const updatedEvent = { ...event, type: e.target.value };
                                    onEventsChange(events.map(ev => ev.id === event.id ? updatedEvent : ev));
                                  }}
                                >
                                  {eventTypes.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={event.description || ""}
                                onChange={(e) => {
                                  const updatedEvent = { ...event, description: e.target.value };
                                  onEventsChange(events.map(ev => ev.id === event.id ? updatedEvent : ev));
                                }}
                                rows={2}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Start Date *</Label>
                                <Input
                                  type="date"
                                  value={event.start_date}
                                  onChange={(e) => {
                                    const updatedEvent = { ...event, start_date: e.target.value };
                                    onEventsChange(events.map(ev => ev.id === event.id ? updatedEvent : ev));
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End Date *</Label>
                                <Input
                                  type="date"
                                  value={event.end_date}
                                  onChange={(e) => {
                                    const updatedEvent = { ...event, end_date: e.target.value };
                                    onEventsChange(events.map(ev => ev.id === event.id ? updatedEvent : ev));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateEvent(event.id, event)}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingEvent(null)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                  <Calendar className="h-6 w-6 text-primary" />
                                </div>
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">{event.title}</h3>
                                  <Badge variant="outline">{event.type}</Badge>
                                  <Badge variant="secondary">{event.priority}</Badge>
                                </div>
                                {event.description && (
                                  <p className="text-muted-foreground text-sm mb-2">{event.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(event.start_date).toLocaleDateString()}
                                  </span>
                                  {event.start_time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {event.start_time}
                                    </span>
                                  )}
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingEvent(event.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEvent(event.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Events */}
            {previousEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Previous Events ({previousEvents.length})</h3>
                <div className="space-y-4">
                  {previousEvents.map((event) => (
                    <Card key={event.id} className="border border-border/50 opacity-75">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-muted/20 to-muted/10 rounded-full flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{event.title}</h3>
                              <Badge variant="outline">{event.type}</Badge>
                            </div>
                            {event.description && (
                              <p className="text-muted-foreground text-sm mb-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.start_date).toLocaleDateString()}
                              </span>
                              {event.start_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.start_time}
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsManager;
