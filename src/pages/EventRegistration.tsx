import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";

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

const EventRegistration = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dietary: "",
    emergency: "",
    agreeToTerms: false,
  });

  // Fetch event details and auto-populate user data
  useEffect(() => {
    const fetchEventAndUserData = async () => {
      try {
        setLoading(true);

        // Fetch event details
        if (id) {
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("*")
            .eq("id", id)
            .single();

          if (eventError) {
            console.error("Error fetching event:", eventError);
            toast({
              title: "Error",
              description: "Failed to load event details",
              variant: "destructive",
            });
            return;
          }

          setEvent(eventData);
        }

        // Auto-populate user data if authenticated
        if (user) {
          // Try to get user data from users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("full_name, email, phone")
            .eq("id", user.id)
            .single();

          if (!userError && userData) {
            // Split full name into first and last name
            const nameParts = (userData.full_name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            setFormData((prev) => ({
              ...prev,
              firstName,
              lastName,
              email: userData.email || user.email || "",
              phone: userData.phone || "",
            }));
          } else {
            // Fallback to auth context data
            const nameParts = (user.full_name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            setFormData((prev) => ({
              ...prev,
              firstName,
              lastName,
              email: user.email || "",
              phone: "",
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndUserData();
  }, [id, user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the terms and conditions to register",
        variant: "destructive",
      });
      return;
    }

    if (!event || !user) {
      toast({
        title: "Registration Error",
        description: "Missing event or user information",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Save registration to event_registrations table
      const { data: registrationData, error: registrationError } =
        await supabase
          .from("event_registrations")
          .insert({
            event_id: event.id,
            user_id: user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone || null,
            dietary_requirements: formData.dietary || null,
            emergency_contact: formData.emergency || null,
            terms_accepted: formData.agreeToTerms,
            status: "registered",
          })
          .select()
          .single();

      if (registrationError) {
        console.error("Registration error:", registrationError);

        // Handle specific error cases
        if (registrationError.code === "23505") {
          toast({
            title: "Already Registered",
            description: "You are already registered for this event",
            variant: "destructive",
          });
        } else if (
          registrationError.message.includes("capacity limit reached")
        ) {
          toast({
            title: "Event Full",
            description: "This event has reached its capacity limit",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration Failed",
            description:
              registrationError.message ||
              "There was an error processing your registration",
            variant: "destructive",
          });
        }
        return;
      }

      console.log("Registration saved:", registrationData);

      toast({
        title: "Registration Successful!",
        description: "You have been registered for this event",
      });

      // Reset form
      setFormData((prev) => ({
        ...prev,
        phone: "",
        dietary: "",
        emergency: "",
        agreeToTerms: false,
      }));
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error processing your registration",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Event Not Found
            </h2>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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

  const { date: startDate, time: startTime } = formatDateTime(event.start_at);
  const { date: endDate, time: endTime } = formatDateTime(event.end_at);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/events"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Event Details Card */}
          <Card className="border-0 bg-gradient-card p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                <p className="text-muted-foreground text-lg">
                  {event.description}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {event.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Start</p>
                  <p className="text-sm text-muted-foreground">
                    {startDate} at {startTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">End</p>
                  <p className="text-sm text-muted-foreground">
                    {endDate} at {endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {event.location || "Location TBD"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {event.capacity || "Unlimited"} attendees
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Registration Form Card */}
          <Card className="border-0 bg-gradient-card p-8">
            <h2 className="text-2xl font-bold mb-6">Registration Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Optional"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="dietary">Dietary Requirements</Label>
                <Textarea
                  id="dietary"
                  value={formData.dietary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dietary: e.target.value,
                    }))
                  }
                  placeholder="Any special dietary requirements or food allergies?"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Textarea
                  id="emergency"
                  value={formData.emergency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emergency: e.target.value,
                    }))
                  }
                  placeholder="Emergency contact person and phone number"
                  disabled={submitting}
                />
              </div>

              <Separator />

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      agreeToTerms: checked as boolean,
                    }))
                  }
                  disabled={submitting}
                />
                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-sm font-medium">
                    I agree to the event terms and conditions *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you acknowledge that you have read and
                    agree to the event terms and conditions, including any
                    liability waivers and photo release agreements.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!formData.agreeToTerms || submitting}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 mr-2">
                      <LoadingSpinner />
                    </div>
                    Processing Registration...
                  </>
                ) : (
                  "Register for Event"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EventRegistration;
