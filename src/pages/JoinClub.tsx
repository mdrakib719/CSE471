import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  Star,
  Upload,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useClubs } from "@/hooks/useDatabase";
import { Club, supabase } from "@/lib/supabase";

const JoinClub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { clubs } = useClubs();

  const [applicationData, setApplicationData] = useState({
    motivation: "",
    experience: "",
    skills: "",
    availability: "",
    expectations: "",
    // portfolio: null as File | null,
    // resume: null as File | null,
    agreeToTerms: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [loadingClub, setLoadingClub] = useState(true);

  // Find current club
  useEffect(() => {
    console.log(
      "JoinClub - Finding club with ID:",
      id,
      "from",
      clubs?.length,
      "clubs"
    );

    if (clubs && id) {
      const club = clubs.find((c) => c.id === id);
      console.log("JoinClub - Found club:", club?.name || "Not found");
      setCurrentClub(club || null);
      setLoadingClub(false);
    } else if (clubs && clubs.length > 0 && id) {
      // Clubs loaded but no match found
      console.log("JoinClub - No club found with ID:", id);
      setCurrentClub(null);
      setLoadingClub(false);
    }
  }, [clubs, id]);

  // Simplified - no need to check existing applications
  useEffect(() => {
    console.log(
      "JoinClub - User authenticated:",
      isAuthenticated,
      "User ID:",
      user?.id
    );
    setCheckingExisting(false);
    setHasExistingApplication(false); // Always allow applications for now
  }, [user, id, isAuthenticated]);

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null
  ) => {
    setApplicationData((prev) => ({ ...prev, [field]: value }));
  };

  // const handleFileUpload = (field: string, file: File | null) => {
  //   setApplicationData((prev) => ({ ...prev, [field]: file }));
  // }

  const handleNewMemberRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Basic validation
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit your application.",
          variant: "destructive",
        });
        return;
      }

      if (!id) {
        toast({
          title: "Error",
          description: "Club ID is missing.",
          variant: "destructive",
        });
        return;
      }

      if (
        !applicationData.motivation.trim() ||
        !applicationData.availability.trim()
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (!applicationData.agreeToTerms) {
        toast({
          title: "Agreement Required",
          description: "Please agree to the terms and conditions.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);

      // Check if already applied
      const { data: existingApplication } = await supabase
        .from("club_membership_application")
        .select("id, status")
        .eq("club_id", id)
        .eq("applicant_id", user.id)
        .single();

      if (existingApplication) {
        toast({
          title: "Already Applied",
          description: `You have already applied to this club. Status: ${existingApplication.status}`,
          variant: "destructive",
        });
        return;
      }

      // Direct insert to Supabase
      const { error } = await supabase
        .from("club_membership_application")
        .insert([
          {
            club_id: id,
            applicant_id: user.id,
            motivation: applicationData.motivation,
            experience: applicationData.experience || null,
            skills: applicationData.skills || null,
            availability: applicationData.availability,
            expectations: applicationData.expectations || null,
            status: "pending",
            application_date: new Date().toISOString(),
            agreed_to_terms: applicationData.agreeToTerms,
          },
        ]);

      if (error) throw error;

      // Reset form
      setApplicationData({
        motivation: "",
        experience: "",
        skills: "",
        availability: "",
        expectations: "",
        agreeToTerms: false,
      });

      toast({
        title: "Application Submitted!",
        description: `Your application to join ${currentClub?.name} has been submitted successfully.`,
      });

      navigate("/clubs");
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast({
        title: "Submission Failed",
        description:
          error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading states
  if (checkingExisting || loadingClub) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 bg-gradient-card p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to join a club.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!currentClub) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 bg-gradient-card p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Club Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The club you're looking for doesn't exist or may have been
              removed.
            </p>
            <Button asChild>
              <Link to="/clubs">Browse All Clubs</Link>
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (hasExistingApplication) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 bg-gradient-card p-8 text-center max-w-md mx-auto">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Application Already Submitted
            </h2>
            <p className="text-muted-foreground mb-6">
              You have already submitted an application to this club. Please
              wait for the review process to complete.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/clubs">Browse Other Clubs</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/profile">View My Applications</Link>
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/clubs"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clubs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Club Info */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-gradient-card overflow-hidden">
              {currentClub.cover_image_url && (
                <img
                  src={currentClub.cover_image_url}
                  alt={currentClub.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">Club</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">New</span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold mb-3">{currentClub.name}</h1>
                <p className="text-muted-foreground mb-4">
                  {currentClub.description || "No description available"}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Created{" "}
                      {new Date(currentClub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {currentClub.is_public ? "Public Club" : "Private Club"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-gradient-card p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Join {currentClub.name}
                </h2>
                <p className="text-muted-foreground">
                  Tell us about yourself and why you'd like to join this club
                </p>
              </div>

              <form onSubmit={handleNewMemberRequest} className="space-y-6">
                {/* Motivation */}
                <div className="space-y-2">
                  <Label htmlFor="motivation">
                    Why do you want to join this club? *
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="Share your motivation..."
                    value={applicationData.motivation}
                    onChange={(e) =>
                      handleInputChange("motivation", e.target.value)
                    }
                    className="min-h-[120px]"
                    required
                  />
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience">Relevant Experience</Label>
                  <Textarea
                    id="experience"
                    placeholder="Any relevant experience..."
                    value={applicationData.experience}
                    onChange={(e) =>
                      handleInputChange("experience", e.target.value)
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills and Interests</Label>
                  <Textarea
                    id="skills"
                    placeholder="Your skills and interests..."
                    value={applicationData.skills}
                    onChange={(e) =>
                      handleInputChange("skills", e.target.value)
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability *</Label>
                  <Textarea
                    id="availability"
                    placeholder="Your availability..."
                    value={applicationData.availability}
                    onChange={(e) =>
                      handleInputChange("availability", e.target.value)
                    }
                    className="min-h-[80px]"
                    required
                  />
                </div>

                {/* Expectations */}
                <div className="space-y-2">
                  <Label htmlFor="expectations">Expectations</Label>
                  <Textarea
                    id="expectations"
                    placeholder="What do you expect from this club?"
                    value={applicationData.expectations}
                    onChange={(e) =>
                      handleInputChange("expectations", e.target.value)
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* ...removed portfolio and resume file upload fields... */}

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={applicationData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      handleInputChange("agreeToTerms", checked as boolean)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to attend the orientation session and actively
                    participate in club activities.
                  </Label>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={!applicationData.agreeToTerms || submitting}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/clubs">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JoinClub;
