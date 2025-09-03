import { useState, useEffect } from "react";
import { AssistantCircleButton } from "@/components/AssistantCircleButton";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Calendar,
  Trophy,
  Sparkles,
  BookOpen,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface HeroStats {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalResources: number;
}

const HeroSection = () => {
  const [stats, setStats] = useState<HeroStats>({
    totalUsers: 0,
    totalClubs: 0,
    totalEvents: 0,
    totalResources: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real statistics from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch total users (students)
        const { count: usersCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "student");

        // Fetch total clubs
        const { count: clubsCount } = await supabase
          .from("clubs")
          .select("*", { count: "exact", head: true })
          .eq("is_public", true);

        // Fetch total events
        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });

        // Fetch total resources
        const { count: resourcesCount } = await supabase
          .from("resources")
          .select("*", { count: "exact", head: true });

        setStats({
          totalUsers: usersCount || 0,
          totalClubs: clubsCount || 0,
          totalEvents: eventsCount || 0,
          totalResources: resourcesCount || 0,
        });
      } catch (error) {
        console.error("Error fetching hero stats:", error);
        // Fallback to default values if there's an error
        setStats({
          totalUsers: 0,
          totalClubs: 0,
          totalEvents: 0,
          totalResources: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format numbers with proper suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M+`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    } else if (num > 0) {
      return `${num}+`;
    } else {
      return "0";
    }
  };

  const statsData = [
    {
      icon: Users,
      label: "BRACU Students",
      value: formatNumber(stats.totalUsers),
    },
    {
      icon: BookOpen,
      label: "Student Clubs",
      value: formatNumber(stats.totalClubs),
    },
    {
      icon: Calendar,
      label: "Campus Events",
      value: formatNumber(stats.totalEvents),
    },
    {
      icon: FileText,
      label: "Learning Resources",
      value: formatNumber(stats.totalResources),
    },
  ];

  // Add some dynamic messaging based on stats
  const getDynamicMessage = () => {
    if (stats.totalUsers > 0 && stats.totalClubs > 0) {
      return `Join ${
        stats.totalClubs
      } active student clubs and connect with ${formatNumber(
        stats.totalUsers
      )} fellow students`;
    } else if (stats.totalUsers > 0) {
      return `Connect with ${formatNumber(
        stats.totalUsers
      )} fellow BRAC University students`;
    } else {
      return "Connect with fellow BRAC University students, join clubs, attend campus events, and participate in the vibrant BRACU community.";
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 pt-16">
      {/* Hero Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in shadow-lg">
            <Sparkles className="h-4 w-4" />
            <span>BRAC University Student Portal</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in">
            BRACU Student
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {" "}
              Community
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            {getDynamicMessage()}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-1
          {/* CTA Buttons */}6 animate-fade-in"
          >
            <Button variant="hero" size="xl" className="group">
              Join the Community Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/learn-more">Learn More</Link>
            </Button>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 animate-fade-in">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="text-center bg-card rounded-lg p-6 shadow-card animate-pulse"
                >
                  <div className="bg-gradient-primary p-3 rounded-lg inline-flex mb-3">
                    <div className="h-6 w-6 bg-white/20 rounded" />
                  </div>
                  <div className="h-8 bg-muted rounded mb-1" />
                  <div className="h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 animate-fade-in">
              {statsData.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center bg-card rounded-lg p-6 shadow-card hover:shadow-md transition-all duration-200 hover:scale-105"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gradient-primary p-3 rounded-lg inline-flex mb-3">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Floating AI Assistant Button */}
      <AssistantCircleButton />
    </section>
  );
};

export default HeroSection;
