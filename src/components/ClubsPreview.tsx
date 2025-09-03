import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Club {
  id: string;
  name: string;
  description: string | null;
  category?: string;
  created_at: string;
  cover_image_url?: string;
}

interface ClubsPreviewProps {
  clubs: Club[];
}

const ClubsPreview = ({ clubs }: ClubsPreviewProps) => {
  // Generate gradient backgrounds for clubs
  const getGradientBackground = (index: number) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-purple-600",
      "bg-gradient-to-br from-orange-500 to-pink-600",
      "bg-gradient-to-br from-green-500 to-teal-600",
      "bg-gradient-to-br from-purple-500 to-indigo-600",
      "bg-gradient-to-br from-red-500 to-orange-600",
      "bg-gradient-to-br from-indigo-500 to-blue-600",
      "bg-gradient-to-br from-pink-500 to-red-600",
      "bg-gradient-to-br from-teal-500 to-green-600",
    ];
    return gradients[index % gradients.length];
  };

  const categories = [
    "All",
    "Academic",
    "Creative",
    "Sports",
    "Community",
    "Technology",
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Discover Student Clubs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Find your community among 30+ active student organizations. From
            academic societies to creative clubs, there's something for
            everyone.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Clubs Grid */}
        {clubs.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clubs available</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a student club and start building your
              community!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {clubs.slice(0, 8).map((club, index) => (
              <Card
                key={club.id}
                className="group hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Club Image/Header */}
                <div
                  className={`h-32 ${getGradientBackground(index)} relative`}
                >
                  <Badge className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm text-white border-white/30">
                    {club.category || "General"}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-1">
                    {club.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {club.description || "No description available"}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Club Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Created {new Date(club.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Open for members</span>
                    </div>
                  </div>

                  {/* Join Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Link to={`/join-club/${club.id}`}>Join Club</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center">
          <Button asChild variant="hero" size="lg" className="group">
            <Link to="/clubs">
              Explore All Clubs
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ClubsPreview;
