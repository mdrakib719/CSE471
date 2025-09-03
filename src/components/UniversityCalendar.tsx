import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Bell,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "./ui/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  type: "event" | "deadline" | "meeting" | "exam" | "holiday";
  category: string;
  priority: "low" | "medium" | "high";
  created_by: string;
  club_id?: string;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

interface MeetingForm {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  agenda: string;
  attendees: string[];
}

const UniversityCalendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    priority: "all",
    search: "",
  });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    agenda: "",
    attendees: [],
  });
  const [userClubs, setUserClubs] = useState<any[]>([]);

  // Fetch all calendar events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error in fetchEvents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's clubs for meeting scheduling
  const fetchUserClubs = async () => {
    if (!user) return;

    try {
      let query;
      if (user.role === "admin") {
        // Admin can see all clubs
        query = supabase.from("clubs").select("*");
      } else if (user.club_admin) {
        // Club admin can see their assigned clubs
        query = supabase
          .from("clubs")
          .select("*")
          .or(`created_by.eq.${user.id},id.eq.${user.club_admin}`);
      } else {
        // Regular users see clubs they're members of
        const { data: applications } = await supabase
          .from("club_membership_application")
          .select("club_id")
          .eq("user_id", user.id)
          .eq("status", "approved");

        if (applications && applications.length > 0) {
          const clubIds = applications.map((app) => app.club_id);
          query = supabase.from("clubs").select("*").in("id", clubIds);
        } else {
          setUserClubs([]);
          return;
        }
      }

      if (query) {
        const { data, error } = await query;
        if (!error && data) {
          setUserClubs(data);
        }
      }
    } catch (error) {
      console.error("Error fetching user clubs:", error);
    }
  };

  // Create new meeting
  const handleCreateMeeting = async () => {
    if (!user) return;

    try {
      const startDateTime = new Date(
        `${meetingForm.date}T${meetingForm.start_time}`
      );
      const endDateTime = new Date(
        `${meetingForm.date}T${meetingForm.end_time}`
      );

      const newMeeting: Partial<CalendarEvent> = {
        title: meetingForm.title,
        description: meetingForm.description,
        start_date: meetingForm.date,
        end_date: meetingForm.date,
        start_time: meetingForm.start_time,
        end_time: meetingForm.end_time,
        location: meetingForm.location,
        type: "meeting",
        category: "Club Meeting",
        priority: "medium",
        created_by: user.id,
        is_all_day: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("calendar_events")
        .insert([newMeeting])
        .select()
        .single();

      if (error) {
        console.error("Error creating meeting:", error);
        toast({
          title: "Error",
          description: "Failed to create meeting",
          variant: "destructive",
        });
        return;
      }

      // Reset form and close dialog
      setMeetingForm({
        title: "",
        description: "",
        date: "",
        start_time: "",
        end_time: "",
        location: "",
        agenda: "",
        attendees: [],
      });
      setShowMeetingForm(false);

      // Refresh events
      fetchEvents();

      toast({
        title: "Meeting Created",
        description: "Meeting has been scheduled successfully",
      });
    } catch (error) {
      console.error("Error in handleCreateMeeting:", error);
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      });
    }
  };

  // Filter events based on current filters
  const filteredEvents = events.filter((event) => {
    if (filters.type !== "all" && event.type !== filters.type) return false;
    if (filters.category !== "all" && event.category !== filters.category)
      return false;
    if (filters.priority !== "all" && event.priority !== filters.priority)
      return false;
    if (
      filters.search &&
      !event.title.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  // Get events for selected date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredEvents.filter((event) => event.start_date === dateStr);
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "deadline":
        return <Clock className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "exam":
        return <Calendar className="h-4 w-4" />;
      case "holiday":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  useEffect(() => {
    fetchEvents();
    fetchUserClubs();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>University Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              University Calendar
            </CardTitle>
            <CardDescription>
              All university activities, deadlines, and important dates
            </CardDescription>
          </div>
          {(user?.role === "admin" || user?.club_admin) && (
            <Dialog open={showMeetingForm} onOpenChange={setShowMeetingForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule New Meeting</DialogTitle>
                  <DialogDescription>
                    Create a new meeting for your club or organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="meeting-title">Meeting Title</Label>
                    <Input
                      id="meeting-title"
                      value={meetingForm.title}
                      onChange={(e) =>
                        setMeetingForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter meeting title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meeting-description">Description</Label>
                    <Textarea
                      id="meeting-description"
                      value={meetingForm.description}
                      onChange={(e) =>
                        setMeetingForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter meeting description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meeting-date">Date</Label>
                      <Input
                        id="meeting-date"
                        type="date"
                        value={meetingForm.date}
                        onChange={(e) =>
                          setMeetingForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="meeting-location">Location</Label>
                      <Input
                        id="meeting-location"
                        value={meetingForm.location}
                        onChange={(e) =>
                          setMeetingForm((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Meeting location"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meeting-start-time">Start Time</Label>
                      <Input
                        id="meeting-start-time"
                        type="time"
                        value={meetingForm.start_time}
                        onChange={(e) =>
                          setMeetingForm((prev) => ({
                            ...prev,
                            start_time: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="meeting-end-time">End Time</Label>
                      <Input
                        id="meeting-end-time"
                        type="time"
                        value={meetingForm.end_time}
                        onChange={(e) =>
                          setMeetingForm((prev) => ({
                            ...prev,
                            end_time: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="meeting-agenda">Agenda</Label>
                    <Textarea
                      id="meeting-agenda"
                      value={meetingForm.agenda}
                      onChange={(e) =>
                        setMeetingForm((prev) => ({
                          ...prev,
                          agenda: e.target.value,
                        }))
                      }
                      placeholder="Meeting agenda and topics"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateMeeting} className="flex-1">
                      Schedule Meeting
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowMeetingForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="deadline">Deadlines</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="exam">Exams</SelectItem>
                  <SelectItem value="holiday">Holidays</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Week
              </Button>
              <Button
                variant={view === "day" ? "default" : "default"}
                size="sm"
                onClick={() => setView("day")}
              >
                Day
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <Tabs value={view} onValueChange={(value) => setView(value as any)}>
          <TabsContent value="month" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}

              {generateMonthDays().map((date, index) => {
                const isCurrentMonth =
                  date.getMonth() === selectedDate.getMonth();
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDate(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-border ${
                      isCurrentMonth ? "bg-background" : "bg-muted/30"
                    } ${isToday ? "ring-2 ring-primary" : ""}`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                      } ${isToday ? "text-primary" : ""}`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:bg-muted ${getPriorityColor(
                            event.priority
                          )}`}
                          title={event.title}
                        >
                          {getTypeIcon(event.type)}
                          <span className="ml-1">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Week View</h3>
            </div>
            <div className="text-center text-muted-foreground">
              Week view implementation coming soon...
            </div>
          </TabsContent>

          <TabsContent value="day" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>

            <div className="space-y-3">
              {getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events scheduled for this date
                </div>
              ) : (
                getEventsForDate(selectedDate).map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(event.type)}
                            <h4 className="font-medium">{event.title}</h4>
                            <Badge className={getPriorityColor(event.priority)}>
                              {event.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.start_time} - {event.end_time}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        {(user?.role === "admin" ||
                          event.created_by === user?.id) && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Upcoming Events List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {filteredEvents
              .filter((event) => new Date(event.start_date) >= new Date())
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(event.type)}
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString()} at{" "}
                        {event.start_time}
                      </p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(event.priority)}>
                    {event.priority}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversityCalendar;
