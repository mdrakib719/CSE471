import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import ClubsPreview from "@/components/ClubsPreview";
import EventsPreview from "@/components/EventsPreview";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Index = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from("clubs")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (clubsError) {
          console.error("Error fetching clubs:", clubsError);
        }

        // Fetch upcoming events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .limit(6);

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        }

        setClubs(clubsData || []);
        setEvents(eventsData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Error Loading Data
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <HeroSection />

        <ClubsPreview clubs={clubs} />
        <EventsPreview events={events} />

        {/* Call to Action Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join your fellow BRACU students in building an active and engaging
              campus community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="xl"
                className="bg-gradient-hero shadow-lg hover:shadow-xl"
              >
                <Link to="/signup">Join BRACU Community</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
