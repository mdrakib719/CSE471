import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEventManagement, type Event, type CreateEventData } from "@/hooks/useEventManagement";

const EventManagement = () => {
  const { toast } = useToast();
  const { 
    events, 
    loading, 
    error, 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    publishEvent 
  } = useEventManagement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
    max_participants: "",
    registration_deadline: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    is_public: "true",
    requires_approval: "false",
    status: "draft"
  });

  const categories = [
    "Academic", "Workshop", "Seminar", "Conference", "Cultural", 
    "Sports", "Social", "Career", "Technology", "Arts", "Other"
  ];

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
      location: "",
      max_participants: "",
      registration_deadline: "",
      contact_person: "",
      contact_email: "",
      contact_phone: "",
      is_public: "true",
      requires_approval: "false",
      status: "draft"
    });
    setEditingEvent(null);
  };

  const handleCreateEvent = async () => {
    const eventData: CreateEventData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      start_date: formData.start_date,
      start_time: formData.start_time,
      end_date: formData.end_date || undefined,
      end_time: formData.end_time || undefined,
      location: formData.location,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
      registration_deadline: formData.registration_deadline || undefined,
      contact_person: formData.contact_person || undefined,
      contact_email: formData.contact_email || undefined,
      contact_phone: formData.contact_phone || undefined,
      is_public: formData.is_public === "true",
      requires_approval: formData.requires_approval === "true",
      status: formData.status as 'draft' | 'published' | 'cancelled',
    };

    const eventId = await createEvent(eventData);
    
    if (eventId) {
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Event Created",
        description: "The event has been created successfully.",
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      start_date: event.start_date,
      start_time: event.start_time,
      end_date: event.end_date || "",
      end_time: event.end_time || "",
      location: event.location,
      max_participants: event.max_participants?.toString() || "",
      registration_deadline: event.registration_deadline || "",
      contact_person: event.contact_person || "",
      contact_email: event.contact_email || "",
      contact_phone: event.contact_phone || "",
      is_public: event.is_public.toString(),
      requires_approval: event.requires_approval.toString(),
      status: event.status
    });
    setIsDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    const eventData: CreateEventData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      start_date: formData.start_date,
      start_time: formData.start_time,
      end_date: formData.end_date || undefined,
      end_time: formData.end_time || undefined,
      location: formData.location,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
      registration_deadline: formData.registration_deadline || undefined,
      contact_person: formData.contact_person || undefined,
      contact_email: formData.contact_email || undefined,
      contact_phone: formData.contact_phone || undefined,
      is_public: formData.is_public === "true",
      requires_approval: formData.requires_approval === "true",
      status: formData.status as 'draft' | 'published' | 'cancelled',
    };

    const success = await updateEvent(editingEvent.id, eventData);
    
    if (success) {
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Event Updated",
        description: "The event has been updated successfully.",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    
    if (success) {
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    const success = await publishEvent(eventId);
    
    if (success) {
      toast({
        title: "Event Published",
        description: "The event is now visible to users.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (date: string, time?: string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString();
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Event Management
              </CardTitle>
              <CardDescription>Create and manage university events</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-gradient-hero">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? "Edit Event" : "Create New Event"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEvent ? "Update the event details" : "Fill in the details to create a new event"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter event title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the event"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Event location"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input
                        id="max_participants"
                        name="max_participants"
                        type="number"
                        value={formData.max_participants}
                        onChange={handleInputChange}
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          name="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="start_time">Start Time *</Label>
                        <Input
                          id="start_time"
                          name="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          name="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          name="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="registration_deadline">Registration Deadline</Label>
                      <Input
                        id="registration_deadline"
                        name="registration_deadline"
                        type="datetime-local"
                        value={formData.registration_deadline}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        placeholder="Event organizer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder="organizer@university.edu"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        placeholder="+880 1234-567890"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <Label htmlFor="is_public">Visibility</Label>
                    <Select value={formData.is_public} onValueChange={(value) => handleSelectChange("is_public", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Public</SelectItem>
                        <SelectItem value="false">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="requires_approval">Registration</Label>
                    <Select value={formData.requires_approval} onValueChange={(value) => handleSelectChange("requires_approval", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Automatic</SelectItem>
                        <SelectItem value="true">Requires Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}>
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events ({events.length})</CardTitle>
          <CardDescription>Manage all university events from here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">{event.title}</h4>
                      <Badge variant={getStatusColor(event.status)}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{event.category}</Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(event.start_date, event.start_time)}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {event.registrations_count || 0} registered
                        {event.max_participants && ` / ${event.max_participants}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {event.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishEvent(event.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events found. Create your first event!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventManagement;