import { useState, useEffect } from "react";
import { Search, Filter, Users, Calendar, MapPin, Star, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useClubs } from "@/hooks/useDatabase";
import { useClubSubscriptions } from "@/hooks/useClubSubscriptions";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

const categories = [
  "All",
  "Academic",
  "Creative",
  "Social",
  "Sports",
  "Cultural",
];

const Clubs = () => {
  const { user } = useAuth();
  const { clubs, loading, createClub } = useClubs();
  const { 
    subscriptions, 
    subscribeToClub, 
    unsubscribeFromClub, 
    isSubscribedToClub,
    getClubMemberCount,
    getClubSubscriptionCount
  } = useClubSubscriptions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [clubStats, setClubStats] = useState<{[key: string]: {members: number, subscribers: number}}>({});
  const [loadingStats, setLoadingStats] = useState<{[key: string]: boolean}>({});

  // Fetch member and subscriber counts for all clubs
  useEffect(() => {
    const fetchClubStats = async () => {
      if (!clubs.length) return;
      
      const stats: {[key: string]: {members: number, subscribers: number}} = {};
      
      for (const club of clubs) {
        try {
          const [memberCount, subscriberCount] = await Promise.all([
            getClubMemberCount(club.id),
            getClubSubscriptionCount(club.id)
          ]);
          
          stats[club.id] = {
            members: memberCount,
            subscribers: subscriberCount
          };
        } catch (error) {
          console.error(`Error fetching stats for club ${club.id}:`, error);
          stats[club.id] = { members: 0, subscribers: 0 };
        }
      }
      
      setClubStats(stats);
    };

    fetchClubStats();
  }, [clubs, getClubMemberCount, getClubSubscriptionCount]);

  // Handle subscribe/unsubscribe
  const handleSubscriptionToggle = async (clubId: string) => {
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    console.log('Subscription toggle clicked for club:', clubId);
    setLoadingStats(prev => ({ ...prev, [clubId]: true }));
    
    try {
      const isSubscribed = isSubscribedToClub(clubId);
      console.log('Current subscription status:', isSubscribed);
      
      if (isSubscribed) {
        console.log('Attempting to unsubscribe...');
        const result = await unsubscribeFromClub(clubId);
        console.log('Unsubscribe result:', result);
      } else {
        console.log('Attempting to subscribe...');
        const result = await subscribeToClub(clubId);
        console.log('Subscribe result:', result);
      }
      
      // Wait a moment for the database to update
      setTimeout(async () => {
        try {
          // Refresh stats for this club
          const [memberCount, subscriberCount] = await Promise.all([
            getClubMemberCount(clubId),
            getClubSubscriptionCount(clubId)
          ]);
          
          console.log('Updated stats:', { memberCount, subscriberCount });
          
          setClubStats(prev => ({
            ...prev,
            [clubId]: { members: memberCount, subscribers: subscriberCount }
          }));
        } catch (error) {
          console.error('Error refreshing stats:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [clubId]: false }));
    }
  };

  // Temporary function to create test clubs
  const createTestClub = async () => {
    try {
      await createClub({
        name: "Test Programming Club",
        description:
          "A club for programming enthusiasts to learn and share knowledge.",
        cover_image_url: null,
        is_public: true,
      });
      console.log("Test club created successfully");
    } catch (error) {
      console.error("Error creating test club:", error);
    }
  };

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.description &&
        club.description.toLowerCase().includes(searchTerm.toLowerCase()));
    // For now, we'll skip category filtering since it's not in our database schema
    // const matchesCategory = selectedCategory === "All" || club.category === selectedCategory;
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Discover University Clubs
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find your passion, connect with like-minded students, and make
            lasting memories
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clubs by name or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {filteredClubs.length} clubs
          </p>
          {/* Temporary test button */}
          {/* <Button onClick={createTestClub} variant="outline" size="sm">
            Create Test Club
          </Button> */}
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Clubs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No clubs have been created yet"}
                </p>
              </div>
            ) : (
              filteredClubs.map((club) => (
                <Card
                  key={club.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-card"
                >
                  <div className="relative">
                    <div className="w-full h-48 rounded-t-lg overflow-hidden">
                      {club.club_image_url ? (
                        <>
                          <img 
                            src={club.club_image_url} 
                            alt={`${club.name} club image`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center hidden">
                            <Users className="h-12 w-12 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                          <Users className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Club Logo - Small display in top-left */}
                    {club.club_logo_url && (
                      <div className="absolute top-4 left-4 w-12 h-12 rounded-lg overflow-hidden border-2 border-background/80 bg-background/80 shadow-sm">
                        <img
                          src={club.club_logo_url}
                          alt={`${club.name} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-background/80">
                        {club.is_public ? "Public" : "Private"}
                      </Badge>
                    </div>
                    
                    {/* Subscription indicator */}
                    {user && (() => {
                      const isSubscribed = isSubscribedToClub(club.id);
                      return isSubscribed ? (
                        <div className={`absolute top-4 ${club.club_logo_url ? 'left-20' : 'left-4'}`}>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <Bell className="h-3 w-3 mr-1" />
                            Subscribed
                          </Badge>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        <Link 
                          to={`/club-details/${club.id}`}
                          className="hover:underline cursor-pointer"
                        >
                          {club.name}
                        </Link>
                      </h3>
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {club.description || "No description available"}
                    </p>

                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Created{" "}
                          {new Date(club.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Club Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{clubStats[club.id]?.members || 0} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bell className="h-4 w-4" />
                          <span>{clubStats[club.id]?.subscribers || 0} subscribers</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link
                          to={`/join-club/${club.id}`}
                          onClick={() => {
                            console.log("Clubs - Navigating to club:", {
                              clubId: club.id,
                              clubName: club.name,
                              fullPath: `/join-club/${club.id}`,
                            });
                          }}
                        >
                          Join Club
                        </Link>
                      </Button>
                      
                      {/* Subscribe/Unsubscribe Button */}
                      {user && (() => {
                        const isSubscribed = isSubscribedToClub(club.id);
                        return (
                          <Button
                            variant={isSubscribed ? "default" : "outline"}
                            size="icon"
                            onClick={() => handleSubscriptionToggle(club.id)}
                            disabled={loadingStats[club.id]}
                            className={isSubscribed ? "bg-green-600 hover:bg-green-700" : ""}
                            title={isSubscribed ? "Unsubscribe from club updates" : "Subscribe to club updates"}
                          >
                            {loadingStats[club.id] ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : isSubscribed ? (
                              <BellOff className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </Button>
                        );
                      })()}
                      
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
              Can't find what you're looking for?
            </h2>
            <p className="text-accent-foreground/80 mb-6">
              Start your own club and bring together students with similar
              interests
            </p>
            <Button variant="secondary" size="lg">
              Contact Us
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
