import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Filter, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import EventManagement from "@/components/EventManagement";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/hooks/useDatabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";


const eventTypes = ["All", "Conference", "Workshop", "Sports", "Cultural", "Academic", "Social"];

const Events = () => {
  const { user } = useAuth();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleEventCreate = async (newEvent: any) => {
    try {
      await createEvent({
        title: newEvent.title,
        description: newEvent.description,
        start_at: `${newEvent.date}T${newEvent.time}:00`,
        end_at: `${newEvent.date}T${newEvent.time}:00`, // For now, same as start time
        location: newEvent.location,
        capacity: newEvent.maxAttendees,
        status: 'scheduled'
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleEventUpdate = async (id: string, updatedEvent: any) => {
    try {
      await updateEvent(id, {
        title: updatedEvent.title,
        description: updatedEvent.description,
        start_at: `${updatedEvent.date}T${updatedEvent.time}:00`,
        end_at: `${updatedEvent.date}T${updatedEvent.time}:00`,
        location: updatedEvent.location,
        capacity: updatedEvent.maxAttendees,
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleEventDelete = async (id: string) => {
    try {
      await deleteEvent(id);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Helper function to determine event status based on dates
  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.start_at);
    const endDate = new Date(event.end_at);

    if (event.status === "cancelled") return "cancelled";
    if (event.status === "completed" || now > endDate) return "ended";
    if (now >= startDate && now <= endDate) return "ongoing";
    return "upcoming";
  };

  // Helper function to check if registration is allowed
  const canRegisterForEvent = (event: any) => {
    const status = getEventStatus(event);
    return status === "upcoming" || status === "ongoing";
  };

  // Helper function to get status badge
  const getStatusBadge = (event: any) => {
    const status = getEventStatus(event);
    
    switch (status) {
      case "ended":
        return <Badge variant="destructive">Event Ended</Badge>;
      case "ongoing":
        return <Badge variant="default" className="bg-green-600">Ongoing</Badge>;
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "All" || event.status === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      
      <div className="container mx-auto px-4 py-8">
        {/* Staff Event Management */}
        {user?.role === 'staff' && (
          <div className="mb-12">
            <EventManagement 
              events={events}
              onEventCreate={handleEventCreate}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
            />
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            {user?.role === 'staff' ? 'All Campus Events' : 'University Events'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {user?.role === 'staff' 
              ? 'View and manage all campus events, workshops, and activities'
              : 'Discover exciting events, workshops, competitions, and activities happening on campus'
            }
          </p>
        </div>

        {/* Event Management for Staff */}
        {user?.role === 'faculty' && (
          <div className="mb-8">
            <EventManagement
              onEventCreate={handleEventCreate}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
            />
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {eventTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Results Count and View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {filteredEvents.length} events
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
        </div>

        {/* Events Grid/List */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedType !== "All" 
                    ? "Try adjusting your search or filters" 
                    : "No events have been created yet"}
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className={`group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-card ${viewMode === "list" ? "flex" : ""}`}>
                  <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                    <div className={`bg-gradient-to-br from-blue-500 to-purple-600 ${viewMode === "list" ? "w-full h-32" : "w-full h-48"} ${viewMode === "list" ? "rounded-l-lg" : "rounded-t-lg"} flex items-center justify-center`}>
                      <Calendar className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(event)}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {event.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(event.start_at).toLocaleDateString()}
                          {new Date(event.start_at).toDateString() !== new Date(event.end_at).toDateString() && 
                            ` - ${new Date(event.end_at).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(event.start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {' - '}
                          {new Date(event.end_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location || "Location TBD"}</span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {canRegisterForEvent(event) ? (
                        <Button asChild className="flex-1">
                          <Link to={`/event-registration/${event.id}`}>
                            Register
                          </Link>
                        </Button>
                      ) : (
                        <Button disabled className="flex-1">
                          {getEventStatus(event) === "ended" ? "Event Ended" : "Registration Closed"}
                        </Button>
                      )}
                      <Button variant="outline" size="icon">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="p-8 bg-gradient-accent border-0">
            <h2 className="text-2xl font-bold text-accent-foreground mb-4">
              Have an event idea?
            </h2>
            <p className="text-accent-foreground/80 mb-6">
              Submit your event proposal and engage the university community
            </p>
            <Button variant="secondary" size="lg">
              Submit Event Proposal
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Events;