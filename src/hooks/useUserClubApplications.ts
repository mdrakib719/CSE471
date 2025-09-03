import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface UserClubApplication {
  id: string;
  club_id: string;
  club_name?: string;
  motivation: string;
  experience: string | null;
  skills: string | null;
  availability: string;
  expectations: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  application_date: string;
  agreed_to_terms: boolean;
  created_at: string;
}

export function useUserClubApplications() {
  const [applications, setApplications] = useState<UserClubApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserApplications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's applications first
      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from("club_membership_application")
          .select(
            `
          id,
          club_id,
          motivation,
          experience,
          skills,
          availability,
          expectations,
          status,
          application_date,
          agreed_to_terms,
          created_at
        `
          )
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error fetching user applications:", applicationsError);
        setError(applicationsError.message);
        return;
      }

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        return;
      }

      // Get unique club IDs from applications
      const clubIds = [...new Set(applicationsData.map((app) => app.club_id))];

      // Fetch club names for these IDs
      const { data: clubsData, error: clubsError } = await supabase
        .from("clubs")
        .select("id, name")
        .in("id", clubIds);

      if (clubsError) {
        console.warn("Error fetching club names:", clubsError);
        // Continue without club names
      }

      // Create a map of club_id to club_name
      const clubNamesMap = new Map();
      if (clubsData) {
        clubsData.forEach((club) => {
          clubNamesMap.set(club.id, club.name);
        });
      }

      // Transform data to include club names
      const transformedData = applicationsData.map((app) => ({
        ...app,
        club_name:
          clubNamesMap.get(app.club_id) || `Club ${app.club_id.slice(0, 8)}...`,
      }));

      console.log("User applications fetched:", transformedData);
      setApplications(transformedData);
    } catch (err) {
      console.error("Error in fetchUserApplications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch applications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, [user?.id]);

  return {
    applications,
    loading,
    error,
    refetch: fetchUserApplications,
  };
}
