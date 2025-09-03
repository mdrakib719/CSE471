import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  capacity: number | null;
  status: string;
  created_by: string;
  created_at: string;
}

interface EventsPreviewProps {
  events: Event[];
}

const EventsPreview = ({ events }: EventsPreviewProps) => {
  // Generate gradient backgrounds for events
  const getGradientBackground = (index: number) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-cyan-600",
      "bg-gradient-to-br from-purple-500 to-pink-600",
      "bg-gradient-to-br from-green-500 to-emerald-600",
      "bg-gradient-to-br from-orange-500 to-red-600",
      "bg-gradient-to-br from-indigo-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-rose-600",
    ];
    return gradients[index % gradients.length];
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  // Get featured events (first 2) and regular events (rest)
  const featuredEvents = events.slice(0, 2);
  const regularEvents = events.slice(2, 6);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Never miss out on campus activities. From academic conferences to
            cultural festivals, stay connected with what's happening.
          </p>
        </div>

        {/* Featured Events */}
        {featuredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an event and start building your community!
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {featuredEvents.map((event, index) => {
              const { date, time } = formatDateTime(event.start_at);
              return (
                <Card
                  key={event.id}
                  className="group hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Event Header */}
                  <div
                    className={`h-40 ${getGradientBackground(
                      index
                    )} relative flex items-end p-6`}
                  >
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                        {event.status}
                      </Badge>
                    </div>
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-white/90 text-sm">Event</p>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {event.description || "No description available"}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-3 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{time}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.location || "Location TBD"}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{event.capacity || "Unlimited"} capacity</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button
                        asChild
                        variant="hero"
                        size="sm"
                        className="flex-1"
                      >
                        <Link to={`/event-registration/${event.id}`}>
                          Learn More
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Regular Events */}
        {regularEvents.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {regularEvents.map((event, index) => {
              const { date, time } = formatDateTime(event.start_at);
              return (
                <Card
                  key={event.id}
                  className="group hover:shadow-md transition-all duration-200 hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1 mb-1">
                          {event.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Event</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description || "No description available"}
                    </p>

                    {/* Compact Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-3 w-3 text-primary" />
                          <span>{event.capacity || "∞"}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="truncate">
                          {event.location || "Location TBD"}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link to={`/event-registration/${event.id}`}>
                          Learn More
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center">
          <Button asChild variant="hero" size="lg" className="group">
            <Link to="/events">
              View All Events
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsPreview;
