import { useState, useEffect } from "react";

import { useAuth } from "@/context/AuthContext";

import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";

import {

  Card,

  CardContent,

  CardHeader,

  CardTitle,

  CardDescription,

} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {

  Users,

  Calendar,

  Plus,

  MapPin,

  Clock,

  UserPlus,

  Trash2,

  Edit,

  CheckCircle,

  XCircle,

  X,

} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";

import ClubImageUpload from "@/components/ClubImageUpload";
import ClubLogoUpload from "@/components/ClubLogoUpload";
import DepartmentManager from "@/components/DepartmentManager";
import AwardsManager from "@/components/AwardsManager";

import Layout from "@/components/Layout";


interface ClubMember {

  id: string;

  applicant_id?: string;

  user_id?: string;

  club_id: string;

  status: "pending" | "approved" | "rejected";

  application_date: string;

  user: {

    full_name: string;

    email: string;

    student_id: string;

    department: string;

  };

}



interface ClubEvent {

  id: string;

  title: string;

  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  type: string;
  category?: string;
  priority?: string;
  is_all_day?: boolean;
  club_id: string;
  created_by: string;
  created_at: string;

}


interface PanelMember {
  id: string;
  student_id: string;
  name: string;
  position: "President" | "Vice President" | "General Secretary" | "Financial Secretary" | "Director";
  department?: string;
  club_id: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    student_id: string;
    department: string;
    avatar_url?: string;
  };
}


interface Club {

  id: string;

  name: string;

  description: string;

  category: string;

  is_public: boolean;

  created_by: string;

  created_at: string;
  updated_at: string;
  cover_image_url?: string;
  club_image_url?: string;
  club_logo_url?: string;
  departments?: Department[];
  club_details?: string;
  panel_members?: any[];
  previous_events?: any[];
  achievements?: any[];
  website?: string;
  social_media?: any;
  founded_date?: string;
  mission_statement?: string;
  vision_statement?: string;
  address?: string;
  meeting_day?: string;
  meeting_time?: string;
  max_members?: number;
  requirements?: string;
  contact_email?: string;
  club_mail?: string;
  contact_phone?: string;
  location?: string;
  status?: string;
  approved_by?: string;
  approved_at?: string;
  meeting_location?: string;
  club_admin?: string;
  panel_members_json?: any[];
}

interface Department {
  id: string;
  name: string;
  description?: string;
  head_name?: string;
  head_student_id?: string;
  members: DepartmentMember[];
}

interface DepartmentMember {
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  role?: string;
}

interface Award {
  id: string;
  title: string;
  description?: string;
  year?: number;
  category?: string;
  award_type?: string;
  issuer?: string;
  image_url?: string;
}




const ClubDashboard = () => {

  const { user } = useAuth();

  const { toast } = useToast();



  const [clubs, setClubs] = useState<Club[]>([]);

  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const [members, setMembers] = useState<ClubMember[]>([]);

  const [events, setEvents] = useState<ClubEvent[]>([]);


  const [loading, setLoading] = useState(true);

  const [savingClub, setSavingClub] = useState(false);



  // Event creation/editing form

  const [showEventForm, setShowEventForm] = useState(false);

  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

  const [eventForm, setEventForm] = useState({

    title: "",

    description: "",

    start_date: "",

    start_time: "",

    end_date: "",

    end_time: "",

    location: "",

    type: "event",
    category: "General",
    priority: "medium",
  });



  // Club settings form

  const [clubForm, setClubForm] = useState({

    name: "",

    description: "",

    category: "",

    is_public: true,

  });



  // New club creation form

  const [showCreateClubForm, setShowCreateClubForm] = useState(false);

  const [showEditClubForm, setShowEditClubForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [clubAwards, setClubAwards] = useState<Award[]>([]);
  const [clubPanel, setClubPanel] = useState<any[]>([]);

  const [newClubForm, setNewClubForm] = useState({

    name: "",

    description: "",

    category: "",

    is_public: true,

    club_details: "",

    panel_members: "",

    previous_events: "",

    achievements: "",

    departments: "",

    website: "",

    social_media: "",

    founded_date: "",

    mission_statement: "",

    vision_statement: "",

    address: "",

    meeting_day: "",

    meeting_time: "",

    max_members: "",

    requirements: "",

    contact_email: "",

    club_mail: "",

    contact_phone: "",

    location: "",

    club_image_url: "",
    departments_json: [] as Department[],
  });

  // Edit club form state
  const [editClubForm, setEditClubForm] = useState({
    name: "",
    description: "",
    category: "",
    is_public: true,
    club_details: "",
    panel_members: "",
    previous_events: "",
    achievements: "",
    departments: "",
    website: "",
    social_media: "",
    founded_date: "",
    mission_statement: "",
    vision_statement: "",
    address: "",
    meeting_day: "",
    meeting_time: "",
    max_members: "",
    requirements: "",
    contact_email: "",
    club_mail: "",
    contact_phone: "",
    location: "",
    club_image_url: "",
    club_logo_url: "",
    departments_json: [] as Department[],
  });



  const isSuperAdmin = user?.role === "admin";



  // Fetch clubs where the user is the creator or assigned admin

  const fetchUserClubs = async () => {

    try {

      let query;



      if (isSuperAdmin) {

        // Superadmin can see all clubs

        query = supabase.from("clubs").select("*");

        console.log("Superadmin: fetching all clubs");

      } else {

        // Regular users can see clubs they created OR clubs they're assigned as admin

        if (user.club_admin) {

          // User has a club admin assignment

          console.log("User has club admin assignment:", user.club_admin);

          query = supabase

            .from("clubs")

            .select("*")

            .or(`created_by.eq.${user.id},id.eq.${user.club_admin}`);

        } else {

          // User only has clubs they created

          console.log("User fetching clubs they created");

          query = supabase.from("clubs").select("*").eq("created_by", user.id);

        }

      }



      console.log(

        "Executing query for user:",

        user.id,

        "club_admin:",

        user.club_admin

      );

      const { data, error } = await query;



      if (error) {

        console.error("Error fetching clubs:", error);

        toast({

          title: "Error",

          description: "Failed to fetch your clubs",

          variant: "destructive",

        });

        return;

      }



      setClubs(data || []);

      if (data && data.length > 0) {

        const firstClub = data[0];

        setSelectedClub(firstClub);

        setClubForm({

          name: firstClub.name || "",

          description: firstClub.description || "",

          category: firstClub.category || "",

          is_public: firstClub.is_public ?? true,

        });

        fetchClubMembers(firstClub.id);

        fetchClubEvents(firstClub.id);

        fetchClubPanel(firstClub.id);

      }

    } catch (error) {

      console.error("Error:", error);

    } finally {

      setLoading(false);

    }

  };



  // Fetch club members

  const fetchClubMembers = async (clubId: string) => {

    try {

      console.log("Fetching members for club:", clubId);



      // First, fetch the applications without the join

      const { data: applications, error: applicationsError } = await supabase

        .from("club_membership_application")

        .select("*")

        .eq("club_id", clubId);



      if (applicationsError) {

        console.error("Error fetching applications:", applicationsError);

        return;

      }



      console.log("Raw applications found:", applications);



      // If we have applications, fetch user details for each one

      if (applications && applications.length > 0) {

        const membersWithUserData = await Promise.all(

          applications.map(async (app) => {

            try {

              const userId = app.user_id || app.applicant_id;

              if (!userId) {

                return {

                  ...app,

                  user: {

                    full_name: "Unknown User",

                    email: "unknown@example.com",

                    student_id: "N/A",

                    department: "N/A",

                  },

                };

              }



              const { data: userData, error: userError } = await supabase

                .from("users")

                .select("full_name, email, student_id, department")

                .eq("id", userId)

                .single();



              if (userError || !userData) {

                console.warn(

                  "Could not fetch user data for:",

                  userId,

                  userError

                );

                // Return application with placeholder user data

                return {

                  ...app,

                  user: {

                    full_name: "Unknown User",

                    email: "unknown@example.com",

                    student_id: "N/A",

                    department: "N/A",

                  },

                };

              }



              return {

                ...app,

                user: userData,

              };

            } catch (userErr) {

              console.warn("Error fetching user data:", userErr);

              return {

                ...app,

                user: {

                  full_name: "Unknown User",

                  email: "unknown@example.com",

                  student_id: "N/A",

                  department: "N/A",

                },

              };

            }

          })

        );



        console.log("Members with user data:", membersWithUserData);

        setMembers(membersWithUserData);

      } else {

        setMembers([]);

      }

    } catch (error) {

      console.error("Error in fetchClubMembers:", error);

      setMembers([]);

    }

  };






  // Handle club selection

  const handleClubSelect = (club: Club) => {

    setSelectedClub(club);

    setClubForm({

      name: club.name || "",

      description: club.description || "",

      category: club.category || "",

      is_public: club.is_public ?? true,

    });

    fetchClubMembers(club.id);

    fetchClubEvents(club.id);

    fetchClubPanel(club.id);

  };



  // Update club basic info
  const handleUpdateClubBasic = async () => {
    if (!selectedClub) return;

    try {

      setSavingClub(true);

      const { error } = await supabase

        .from("clubs")

        .update({

          name: clubForm.name.trim(),

          description: clubForm.description.trim(),

          category: clubForm.category.trim(),

          is_public: clubForm.is_public,

        })

        .eq("id", selectedClub.id);



      if (error) {

        console.error("Error updating club:", error);

        toast({

          title: "Update failed",

          description: "Could not update club",

          variant: "destructive",

        });

        return;

      }



      // Reflect changes locally

      const updated: Club = { ...selectedClub, ...clubForm } as Club;

      setSelectedClub(updated);

      setClubs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      toast({

        title: "Club updated",

        description: "Your changes have been saved",

      });

    } catch (e) {

      console.error("Error updating club:", e);

      toast({

        title: "Update failed",

        description: "Unexpected error",

        variant: "destructive",

      });

    } finally {

      setSavingClub(false);

    }

  };



  // Create new club

  const handleCreateClub = async () => {

    if (!isSuperAdmin) {

      toast({

        title: "Not allowed",

        description: "Only superadmin can create clubs",

        variant: "destructive",

      });

      return;

    }

    if (

      !newClubForm.name.trim() ||

      !newClubForm.description.trim() ||

      !newClubForm.category

    ) {

      toast({

        title: "Missing Information",

        description: "Please fill in all required fields",

        variant: "destructive",

      });

      return;

    }



    try {

      const { data, error } = await supabase

        .from("clubs")

        .insert({

          name: newClubForm.name.trim(),

          description: newClubForm.description.trim(),

          category: newClubForm.category,

          is_public: newClubForm.is_public,

          club_details: newClubForm.club_details.trim() || null,

          panel_members: newClubForm.panel_members.trim() || null,

          previous_events: newClubForm.previous_events.trim() || null,

          achievements: newClubForm.achievements.trim() || null,

          website: newClubForm.website.trim() || null,

          social_media: newClubForm.social_media.trim() || null,

          founded_date: newClubForm.founded_date || null,

          mission_statement: newClubForm.mission_statement.trim() || null,

          vision_statement: newClubForm.vision_statement.trim() || null,

          address: newClubForm.address.trim() || null,

          meeting_day: newClubForm.meeting_day || null,

          meeting_time: newClubForm.meeting_time || null,

          max_members: newClubForm.max_members ? parseInt(newClubForm.max_members) : null,

          requirements: newClubForm.requirements.trim() || null,

          contact_email: newClubForm.contact_email.trim() || null,

          club_mail: newClubForm.club_mail.trim() || null,

          contact_phone: newClubForm.contact_phone.trim() || null,

          location: newClubForm.location.trim() || null,

          club_image_url: newClubForm.club_image_url || null,
          club_logo_url: newClubForm.club_logo_url || null,
          departments: newClubForm.departments_json || [],
          created_by: user.id,

        })

        .select()

        .single();



      if (error) {

        console.error("Error creating club:", error);

        toast({

          title: "Creation failed",

          description: "Could not create club",

          variant: "destructive",

        });

        return;

      }



      // Add to clubs list and select it

      const newClub = { ...data, created_by: user.id } as Club;

      setClubs((prev) => [newClub, ...prev]);

      setSelectedClub(newClub);

      setClubForm({

        name: newClub.name || "",

        description: newClub.description || "",

        category: newClub.category || "",

        is_public: newClub.is_public ?? true,

      });



      // Reset form and close modal

      setNewClubForm({

        name: "",

        description: "",

        category: "",

        is_public: true,

        club_details: "",

        panel_members: "",

        previous_events: "",

        achievements: "",

        departments: "",

        website: "",

        social_media: "",

        founded_date: "",

        mission_statement: "",

        vision_statement: "",

        address: "",

        meeting_day: "",

        meeting_time: "",

        max_members: "",

        requirements: "",

        contact_email: "",

        club_mail: "",

        contact_phone: "",

        location: "",

        club_image_url: "",
        club_logo_url: "",
        departments_json: [],
      });

      setShowCreateClubForm(false);



      // Fetch members, events, and panel for the new club
      fetchClubMembers(newClub.id);

      fetchClubEvents(newClub.id);

      fetchClubPanel(newClub.id);


      toast({

        title: "Club created",

        description: `${newClub.name} has been created successfully`,

      });

    } catch (e) {

      console.error("Error creating club:", e);

      toast({

        title: "Creation failed",

        description: "Unexpected error",

        variant: "destructive",

      });

    }

  };


  // Handle editing a club
  // Fetch awards for selected club
  const fetchClubAwards = async (clubId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_awards')
        .select('*')
        .eq('club_id', clubId)
        .order('year', { ascending: false });

      if (error) {
        console.error('Error fetching awards:', error);
        return;
      }

      setClubAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
    }
  };

  // Fetch events for selected club
  const fetchClubEvents = async (clubId: string) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('club_id', clubId)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch panel members for selected club
  const fetchClubPanel = async (clubId: string) => {
    try {
      // Get main panel members from panel_members_json
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('panel_members_json, departments')
        .eq('id', clubId)
        .single();

      if (clubError) {
        console.error('Error fetching club panel data:', clubError);
        return;
      }

      const panelMembers = clubData.panel_members_json || [];
      const departments = clubData.departments || [];

      // Create panel members array with department heads as directors
      const allPanelMembers = [
        ...panelMembers,
        ...departments.map((dept: any) => ({
          id: `dept-${dept.id}`,
          student_id: dept.head_student_id,
          name: dept.head_name,
          position: "Director" as const,
          department: dept.name,
          club_id: clubId,
          user: {
            id: dept.head_student_id,
            full_name: dept.head_name,
            email: dept.head_email || '',
            student_id: dept.head_student_id,
            department: dept.name,
          }
        }))
      ];

      setClubPanel(allPanelMembers);
    } catch (error) {
      console.error('Error fetching panel members:', error);
    }
  };



  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    fetchClubAwards(club.id);
    fetchClubEvents(club.id);
    fetchClubPanel(club.id);
    setEditClubForm({
      name: club.name || "",
      description: club.description || "",
      category: club.category || "",
      is_public: club.is_public ?? true,
      club_details: club.club_details || "",
      panel_members: Array.isArray(club.panel_members) ? "" : (typeof club.panel_members === 'string' ? club.panel_members : ""),
      previous_events: Array.isArray(club.previous_events) ? "" : (club.previous_events || ""),
      achievements: Array.isArray(club.achievements) ? "" : (club.achievements || ""),
      departments: Array.isArray(club.departments) ? "" : (club.departments || ""),
      website: club.website || "",
      social_media: club.social_media || "",
      founded_date: club.founded_date || "",
      mission_statement: club.mission_statement || "",
      vision_statement: club.vision_statement || "",
      address: club.address || "",
      meeting_day: club.meeting_day || "",
      meeting_time: club.meeting_time || "",
      max_members: club.max_members?.toString() || "",
      requirements: club.requirements || "",
      contact_email: club.contact_email || "",
      club_mail: club.club_mail || "",
      contact_phone: club.contact_phone || "",
      location: club.location || "",
      club_image_url: club.club_image_url || "",
      club_logo_url: club.club_logo_url || "",
      departments_json: club.departments || [],
    });
    setShowEditClubForm(true);
  };

  // Handle updating a club
  const handleUpdateClub = async () => {
    if (!user || !editingClub) return;

    // Validate required fields
    if (!editClubForm.name.trim()) {
      toast({
        title: "Error",
        description: "Club name is required",
        variant: "destructive",
      });
      return;
    }

    if (!editClubForm.description.trim()) {
      toast({
        title: "Error",
        description: "Club description is required",
        variant: "destructive",
      });
      return;
    }

    if (!editClubForm.category.trim()) {
      toast({
        title: "Error",
        description: "Club category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Start with basic fields that we know exist
      const updateData: any = {
        name: editClubForm.name.trim(),
        description: editClubForm.description.trim(),
        category: editClubForm.category.trim(),
        is_public: editClubForm.is_public,
      };

      // Add fields that are likely to exist based on the database schema
      if (editClubForm.club_image_url) updateData.club_image_url = editClubForm.club_image_url;
      if (editClubForm.club_logo_url) updateData.club_logo_url = editClubForm.club_logo_url;
      if (editClubForm.max_members?.trim()) updateData.max_members = parseInt(editClubForm.max_members);
      if (editClubForm.requirements?.trim()) updateData.requirements = editClubForm.requirements.trim();
      if (editClubForm.contact_email?.trim()) updateData.contact_email = editClubForm.contact_email.trim();
      if (editClubForm.club_mail?.trim()) updateData.club_mail = editClubForm.club_mail.trim();
      if (editClubForm.contact_phone?.trim()) updateData.contact_phone = editClubForm.contact_phone.trim();
      if (editClubForm.location?.trim()) updateData.location = editClubForm.location.trim();
      if (editClubForm.address?.trim()) updateData.address = editClubForm.address.trim();
      if (editClubForm.meeting_day?.trim()) updateData.meeting_day = editClubForm.meeting_day.trim();
      if (editClubForm.meeting_time?.trim()) updateData.meeting_time = editClubForm.meeting_time.trim();

      // Add departments (using the existing 'departments' column, not 'departments_json')
      if (editClubForm.departments_json && editClubForm.departments_json.length > 0) {
        updateData.departments = editClubForm.departments_json;
      }

      const { error } = await supabase
        .from('clubs')
        .update(updateData)
        .eq('id', editingClub.id);

      if (error) {
        console.error('Error updating club:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        toast({
          title: "Error",
          description: `Failed to update club: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Club updated successfully!",
      });

      // Close edit form
      setShowEditClubForm(false);
      setEditingClub(null);

      // Refresh clubs list
      fetchUserClubs();
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };


  // Delete club (and related data)

  const handleDeleteClub = async () => {

    if (!selectedClub) return;

    const confirmDelete = confirm(

      "This will delete the club, its events and applications. Continue?"

    );

    if (!confirmDelete) return;

    try {

      // Best-effort cleanup of related rows first

      await supabase.from("events").delete().eq("club_id", selectedClub.id);

      await supabase

        .from("club_membership_application")

        .delete()

        .eq("club_id", selectedClub.id);

      const { error } = await supabase

        .from("clubs")

        .delete()

        .eq("id", selectedClub.id);

      if (error) {

        console.error("Error deleting club:", error);

        toast({

          title: "Delete failed",

          description: "Could not delete club",

          variant: "destructive",

        });

        return;

      }

      toast({

        title: "Club deleted",

        description: `${selectedClub.name} has been removed`,

      });

      // Refresh state

      const remaining = clubs.filter((c) => c.id !== selectedClub.id);

      setClubs(remaining);

      setSelectedClub(remaining[0] ?? null);

    } catch (e) {

      console.error("Error deleting club:", e);

      toast({

        title: "Delete failed",

        description: "Unexpected error",

        variant: "destructive",

      });

    }

  };



  // Approve/reject member application

  const handleMemberAction = async (

    memberId: string,

    action: "approve" | "reject"

  ) => {

    try {

      const { error } = await supabase

        .from("club_membership_application")

        .update({ status: action === "approve" ? "approved" : "rejected" })

        .eq("id", memberId);



      if (error) {

        console.error("Error updating member status:", error);

        toast({

          title: "Error",

          description: "Failed to update member status",

          variant: "destructive",

        });

        return;

      }



      // Refresh members list

      if (selectedClub) {

        fetchClubMembers(selectedClub.id);

      }



      toast({

        title: "Success",

        description: `Member ${

          action === "approve" ? "approved" : "rejected"

        } successfully`,

      });

    } catch (error) {

      console.error("Error:", error);

    }

  };



  // Delete member application

  const handleDeleteMember = async (memberId: string) => {

    if (!confirm("Are you sure you want to remove this member from the club?"))

      return;



    try {

      const { error } = await supabase

        .from("club_membership_application")

        .delete()

        .eq("id", memberId);



      if (error) {

        console.error("Error deleting member:", error);

        toast({

          title: "Error",

          description: "Failed to remove member",

          variant: "destructive",

        });

        return;

      }



      // Refresh members list

      if (selectedClub) {

        fetchClubMembers(selectedClub.id);

      }



      toast({

        title: "Success",

        description: "Member removed from club successfully",

      });

    } catch (error) {

      console.error("Error:", error);

    }

  };



  // Send notification to club members

  const sendEventNotificationToClubMembers = async (

    eventData: any,

    clubId: string

  ) => {

    try {

      console.log(

        "Sending notification to club members for event:",

        eventData.title

      );



      // Fetch all approved club members

      const { data: applications, error: applicationsError } = await supabase

        .from("club_membership_application")

        .select("applicant_id")

        .eq("club_id", clubId)

        .eq("status", "approved");



      if (applicationsError) {

        console.error("Error fetching club members:", applicationsError);

        return;

      }



      if (!applications || applications.length === 0) {

        console.log("No approved members found for club:", clubId);

        return;

      }



      // Get club name for notification

      const { data: clubData } = await supabase

        .from("clubs")

        .select("name")

        .eq("id", clubId)

        .single();



      const clubName = clubData?.name || "Unknown Club";



      // Prepare notification message

      const notificationMessage = `New event "${

        eventData.title

      }" has been created in ${clubName}! 📅 Event starts on ${new Date(

        eventData.start_at

      ).toLocaleDateString()} at ${

        eventData.location || "TBA"

      }. Don't miss out!`;



      // Send notification to each member

      const notifications = applications.map((app) => {

        return {

          user_id: app.applicant_id,

          message: notificationMessage,

          type: "event_created",

          related_id: eventData.id,

          created_at: new Date().toISOString(),

          is_read: false,

        };

      });



      // Batch insert notifications

      const { error: notificationError } = await supabase

        .from("notifications")

        .insert(notifications);



      if (notificationError) {

        console.error("Error sending notifications:", notificationError);

      } else {

        console.log(

          `Successfully sent ${notifications.length} notifications for event: ${eventData.title}`

        );

      }

    } catch (error) {

      console.error("Error in sendEventNotificationToClubMembers:", error);

    }

  };



  // Create new event

  const handleCreateEvent = async () => {

    if (!selectedClub) return;



    try {

      const { data, error } = await supabase

        .from("calendar_events")
        .insert({

          title: eventForm.title,

          description: eventForm.description,

          start_date: eventForm.start_date,
          end_date: eventForm.end_date,
          start_time: eventForm.start_time,
          end_time: eventForm.end_time,
          location: eventForm.location,

          type: eventForm.type,
          category: eventForm.category,
          priority: eventForm.priority,
          is_all_day: false,
          club_id: selectedClub.id,

          created_by: user.id,

        })

        .select()

        .single();



      if (error) {

        console.error("Error creating event:", error);

        toast({

          title: "Error",

          description: "Failed to create event",

          variant: "destructive",

        });

        return;

      }



      // Refresh events list

      fetchClubEvents(selectedClub.id);



      // Reset form

      setEventForm({

        title: "",

        description: "",

        start_date: "",

        start_time: "",

        end_date: "",

        end_time: "",

        location: "",

        type: "event",
        category: "General",
        priority: "medium",
      });

      setShowEventForm(false);



      toast({

        title: "Success",

        description: "Event created successfully",
      });

    } catch (error) {

      console.error("Error:", error);

    }

  };



  // Delete event

  const handleDeleteEvent = async (eventId: string) => {

    if (!confirm("Are you sure you want to delete this event?")) return;



    try {

      const { error } = await supabase

        .from("calendar_events")
        .delete()

        .eq("id", eventId);



      if (error) {

        console.error("Error deleting event:", error);

        toast({

          title: "Error",

          description: "Failed to delete event",

          variant: "destructive",

        });

        return;

      }



      // Refresh events list

      if (selectedClub) {

        fetchClubEvents(selectedClub.id);

      }



      toast({

        title: "Success",

        description: "Event deleted successfully",

      });

    } catch (error) {

      console.error("Error:", error);

    }

  };



  // Edit event handler

  const handleEditEvent = (event: ClubEvent) => {

    setEditingEvent(event);

    setEventForm({

      title: event.title,

      description: event.description || "",
      start_date: event.start_date,
      start_time: event.start_time || "",
      end_date: event.end_date,
      end_time: event.end_time || "",
      location: event.location || "",
      type: event.type,
      category: event.category || "General",
      priority: event.priority || "medium",
    });

    setShowEventForm(true);

  };



  // Update event

  const handleUpdateEvent = async () => {

    if (!editingEvent || !selectedClub) return;



    try {

      const { data, error } = await supabase

        .from("calendar_events")
        .update({

          title: eventForm.title,

          description: eventForm.description,

          start_date: eventForm.start_date,
          end_date: eventForm.end_date,
          start_time: eventForm.start_time,
          end_time: eventForm.end_time,
          location: eventForm.location,

          type: eventForm.type,
          category: eventForm.category,
          priority: eventForm.priority,
        })

        .eq("id", editingEvent.id)

        .select()

        .single();



      if (error) {

        console.error("Error updating event:", error);

        toast({

          title: "Error",

          description: "Failed to update event",

          variant: "destructive",

        });

        return;

      }



      // Refresh events list

      fetchClubEvents(selectedClub.id);



      // Reset form and editing state

      setEventForm({

        title: "",

        description: "",

        start_date: "",

        start_time: "",

        end_date: "",

        end_time: "",

        location: "",

        type: "event",
        category: "General",
        priority: "medium",
      });

      setEditingEvent(null);

      setShowEventForm(false);



      toast({

        title: "Success",

        description: "Event updated successfully",

      });

    } catch (error) {

      console.error("Error:", error);

    }

  };



  // Cancel editing

  const handleCancelEdit = () => {

    setEditingEvent(null);

    setEventForm({

      title: "",

      description: "",

      start_date: "",

      start_time: "",

      end_date: "",

      end_time: "",

      location: "",

      type: "event",
      category: "General",
      priority: "medium",
    });

    setShowEventForm(false);

  };


  // Panel management functions
  const [showPanelForm, setShowPanelForm] = useState(false);
  const [editingPanelMember, setEditingPanelMember] = useState<any>(null);
  const [panelForm, setPanelForm] = useState({
    student_id: "",
    position: "President" as "President" | "Vice President" | "General Secretary" | "Financial Secretary",
  });

  // Add panel member
  const handleAddPanelMember = async () => {
    if (!selectedClub || !panelForm.student_id || !panelForm.position) return;

    try {
      // First, get the user details by student ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, student_id, department')
        .eq('student_id', panelForm.student_id)
        .single();

      if (userError || !userData) {
        toast({
          title: "Error",
          description: "Student not found with this ID",
          variant: "destructive",
        });
        return;
      }

      // Get current panel members
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('panel_members_json')
        .eq('id', selectedClub.id)
        .single();

      if (clubError) {
        console.error('Error fetching club data:', clubError);
        return;
      }

      const currentPanel = clubData.panel_members_json || [];
      
      // Check if position is already taken
      if (currentPanel.some((member: any) => member.position === panelForm.position)) {
        toast({
          title: "Error",
          description: `${panelForm.position} position is already taken`,
          variant: "destructive",
        });
        return;
      }

      // Add new panel member
      const newPanelMember = {
        id: Date.now().toString(),
        student_id: panelForm.student_id,
        name: userData.full_name,
        position: panelForm.position,
        club_id: selectedClub.id,
        user: userData,
      };

      const updatedPanel = [...currentPanel, newPanelMember];

      // Update club with new panel
      const { error: updateError } = await supabase
        .from('clubs')
        .update({ panel_members_json: updatedPanel })
        .eq('id', selectedClub.id);

      if (updateError) {
        console.error('Error updating panel:', updateError);
        toast({
          title: "Error",
          description: "Failed to add panel member",
          variant: "destructive",
        });
        return;
      }

      // Refresh panel data
      fetchClubPanel(selectedClub.id);

      // Reset form
      setPanelForm({
        student_id: "",
        position: "President",
      });
      setShowPanelForm(false);

      toast({
        title: "Success",
        description: `${userData.full_name} added as ${panelForm.position}`,
      });
    } catch (error) {
      console.error('Error adding panel member:', error);
      toast({
        title: "Error",
        description: "Failed to add panel member",
        variant: "destructive",
      });
    }
  };

  // Remove panel member
  const handleRemovePanelMember = async (memberId: string, position: string) => {
    if (!selectedClub || !confirm(`Are you sure you want to remove the ${position}?`)) return;

    try {
      // Get current panel members
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('panel_members_json')
        .eq('id', selectedClub.id)
        .single();

      if (clubError) {
        console.error('Error fetching club data:', clubError);
        return;
      }

      const currentPanel = clubData.panel_members_json || [];
      const updatedPanel = currentPanel.filter((member: any) => member.id !== memberId);

      // Update club with updated panel
      const { error: updateError } = await supabase
        .from('clubs')
        .update({ panel_members_json: updatedPanel })
        .eq('id', selectedClub.id);

      if (updateError) {
        console.error('Error updating panel:', updateError);
        toast({
          title: "Error",
          description: "Failed to remove panel member",
          variant: "destructive",
        });
        return;
      }

      // Refresh panel data
      fetchClubPanel(selectedClub.id);

      toast({
        title: "Success",
        description: `${position} removed successfully`,
      });
    } catch (error) {
      console.error('Error removing panel member:', error);
      toast({
        title: "Error",
        description: "Failed to remove panel member",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {

    if (user?.id) {

      console.log("User authenticated, fetching clubs. User:", {

        id: user.id,

        role: user.role,

        club_admin: user.club_admin,

      });

      fetchUserClubs();

    } else {

      console.log("No user authenticated");

    }

  }, [user]);



  useEffect(() => {

    if (selectedClub) {

      fetchClubMembers(selectedClub.id);

      fetchClubEvents(selectedClub.id);

      fetchClubPanel(selectedClub.id);
    }

  }, [selectedClub]);



  if (loading) {

    return (

      <div className="flex items-center justify-center h-[calc(100vh-80px)]">

        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>

          <p>Loading your clubs...</p>

        </div>

      </div>

    );

  }



  // Access control: only superadmin or users who manage at least one club

  if (!isSuperAdmin && clubs.length === 0) {

    return (

      <div className="flex items-center justify-center h-[calc(100vh-80px)]">

        <div className="text-center max-w-md">

          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />

          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>

          <p className="text-muted-foreground">

            You do not have permission to access the Club Dashboard.

          </p>

        </div>

      </div>

    );

  }



  if (clubs.length === 0) {

    return (

      <div className="flex items-center justify-center h-[calc(100vh-80px)]">

        <div className="text-center">

          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />

          <h2 className="text-2xl font-semibold mb-2">No Clubs Found</h2>

          <p className="text-muted-foreground mb-4">

            You haven't created any clubs yet. Create a club to get started!

          </p>

          {isSuperAdmin && (

            <Button onClick={() => setShowCreateClubForm(true)}>

              Create Your First Club

            </Button>

          )}

        </div>

      </div>

    );

  }



  return (

    <Layout>
    <div className="container mx-auto p-6 space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">Club Dashboard</h1>

          <p className="text-muted-foreground">

            Manage your clubs, members, and events

          </p>

        </div>

        {isSuperAdmin && (

          <Button

            onClick={() => setShowCreateClubForm(true)}

            className="flex items-center gap-2"

          >

            <Plus className="h-4 w-4" />

            Create New Club

          </Button>

        )}

      </div>



      {/* Club Selection */}

      <div className="flex gap-4 overflow-x-auto pb-2">

        {clubs.map((club) => (

          <div key={club.id} className="flex items-center gap-2">
          <Button

            variant={selectedClub?.id === club.id ? "default" : "outline"}

            onClick={() => handleClubSelect(club)}

            className="whitespace-nowrap"

          >

            {club.name}

          </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClub(club);
              }}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              title="Edit Club"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {isSuperAdmin && (

          <Button

            variant="outline"

            onClick={() => setShowCreateClubForm(true)}

            className="whitespace-nowrap flex items-center gap-2"

          >

            <Plus className="h-4 w-4" />

            New Club

          </Button>

        )}

      </div>



      {selectedClub && (

        <div className="space-y-6">

          {/* Club Info */}

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <Users className="h-5 w-5" />

                {selectedClub.name}

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="text-muted-foreground mb-2">

                {selectedClub.description}

              </p>

              <div className="flex gap-4 text-sm">

                <Badge variant="secondary">{selectedClub.category}</Badge>

                <Badge variant={selectedClub.is_public ? "default" : "outline"}>

                  {selectedClub.is_public ? "Public" : "Private"}

                </Badge>

              </div>

            </CardContent>

          </Card>



          {/* Tabs */}

          <Tabs defaultValue="members" className="space-y-4">

            <TabsList>

              <TabsTrigger value="members" className="flex items-center gap-2">

                <Users className="h-4 w-4" />

                Members ({members.length})

              </TabsTrigger>

              <TabsTrigger value="panel" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Panel ({clubPanel.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">

                <Calendar className="h-4 w-4" />

                Events
              </TabsTrigger>

              <TabsTrigger value="settings" className="flex items-center gap-2">

                <Edit className="h-4 w-4" />

                Settings

              </TabsTrigger>

            </TabsList>



            {/* Members Tab */}

            <TabsContent value="members" className="space-y-4">

              <div className="flex justify-between items-center">

                <h3 className="text-lg font-semibold">Club Members</h3>

                <Badge variant="outline">

                  {members.filter((m) => m.status === "approved").length}{" "}

                  Approved

                </Badge>

              </div>



              <div className="grid gap-4">

                {members.length === 0 ? (

                  <Card>

                    <CardContent className="text-center py-8">

                      <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

                      <p className="text-muted-foreground">

                        No members have applied yet

                      </p>

                    </CardContent>

                  </Card>

                ) : (

                  members.map((member) => (

                    <Card key={member.id}>

                      <CardContent className="p-4">

                        <div className="flex items-center justify-between">

                          <div className="flex-1">

                            <h4 className="font-semibold">

                              {member.user.full_name}

                            </h4>

                            <p className="text-sm text-muted-foreground">

                              {member.user.email}

                            </p>

                            <div className="flex gap-2 mt-2 text-xs">

                              <Badge variant="outline">

                                ID: {member.user.student_id}

                              </Badge>

                              <Badge variant="outline">

                                {member.user.department}

                              </Badge>

                              <Badge

                                variant={

                                  member.status === "approved"

                                    ? "default"

                                    : member.status === "rejected"

                                    ? "destructive"

                                    : "secondary"

                                }

                              >

                                {member.status.charAt(0).toUpperCase() +

                                  member.status.slice(1)}

                              </Badge>

                            </div>

                          </div>



                          <div className="flex gap-2">

                            {member.status === "pending" && (

                              <>

                                <Button

                                  size="sm"

                                  onClick={() =>

                                    handleMemberAction(member.id, "approve")

                                  }

                                  className="bg-green-600 hover:bg-green-700"

                                >

                                  <CheckCircle className="h-4 w-4 mr-1" />

                                  Approve

                                </Button>

                                <Button

                                  size="sm"

                                  variant="destructive"

                                  onClick={() =>

                                    handleMemberAction(member.id, "reject")

                                  }

                                >

                                  <XCircle className="h-4 w-4 mr-1" />

                                  Reject

                                </Button>

                              </>

                            )}

                            <Button

                              size="sm"

                              variant="outline"

                              onClick={() => handleDeleteMember(member.id)}

                              className="text-red-600 hover:text-red-700 hover:bg-red-50"

                            >

                              <Trash2 className="h-4 w-4 mr-1" />

                              Remove

                            </Button>

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                  ))

                )}

              </div>

            </TabsContent>


            {/* Panel Tab */}
            <TabsContent value="panel" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Executive Panel</h3>
                <Button onClick={() => setShowPanelForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Panel Member
                </Button>
              </div>

              {/* Panel Member Form */}
              {showPanelForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Panel Member</CardTitle>
                    <CardDescription>
                      Add a new member to the executive panel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="panel-student-id">Student ID</Label>
                        <Input
                          id="panel-student-id"
                          value={panelForm.student_id}
                          onChange={(e) =>
                            setPanelForm({ ...panelForm, student_id: e.target.value })
                          }
                          placeholder="Enter student ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panel-position">Position</Label>
                        <select
                          id="panel-position"
                          value={panelForm.position}
                          onChange={(e) =>
                            setPanelForm({ ...panelForm, position: e.target.value as any })
                          }
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="President">President</option>
                          <option value="Vice President">Vice President</option>
                          <option value="General Secretary">General Secretary</option>
                          <option value="Financial Secretary">Financial Secretary</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleAddPanelMember}>
                        Add Panel Member
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPanelForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Panel Members List */}
              <div className="grid gap-4">
                {clubPanel.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No panel members added yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Add the main executive panel members
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  clubPanel.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg">
                                  {member.name}
                                </h4>
                                <p className="text-primary font-medium">
                                  {member.position}
                                </p>
                                {member.department && (
                                  <p className="text-sm text-muted-foreground">
                                    {member.department}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {member.position !== "Director" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemovePanelMember(member.id, member.position)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>


            {/* Events Tab */}

            <TabsContent value="events" className="space-y-4">

              <div className="flex justify-between items-center">

                <h3 className="text-lg font-semibold">Club Events</h3>

                <Button onClick={() => setShowEventForm(true)}>

                  <Plus className="h-4 w-4 mr-2" />

                  Create Event

                </Button>

              </div>



              {/* Event Creation/Editing Form */}

              {showEventForm && (

                <Card>

                  <CardHeader>

                    <CardTitle>

                      {editingEvent ? "Edit Event" : "Create New Event"}

                    </CardTitle>

                    <CardDescription>

                      {editingEvent

                        ? "Update event information"

                        : "Fill in the details to create a new event"}

                    </CardDescription>

                  </CardHeader>

                  <CardContent className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-2">
                        <Label htmlFor="event-title">Event Title</Label>
                      <Input

                          id="event-title"
                        value={eventForm.title}

                        onChange={(e) =>

                          setEventForm({ ...eventForm, title: e.target.value })

                        }

                          placeholder="Enter event title"
                      />

                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-location">Location</Label>
                      <Input

                          id="event-location"
                        value={eventForm.location}

                        onChange={(e) =>

                            setEventForm({ ...eventForm, location: e.target.value })
                          }
                          placeholder="Enter event location"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-description">Description</Label>
                      <Textarea
                        id="event-description"
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, description: e.target.value })
                        }
                        placeholder="Enter event description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-start-date">Start Date</Label>
                      <Input

                          id="event-start-date"
                        type="date"

                        value={eventForm.start_date}

                        onChange={(e) =>

                            setEventForm({ ...eventForm, start_date: e.target.value })
                        }

                      />

                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-start-time">Start Time</Label>
                      <Input

                          id="event-start-time"
                        type="time"

                        value={eventForm.start_time}

                        onChange={(e) =>

                            setEventForm({ ...eventForm, start_time: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-end-date">End Date</Label>
                      <Input

                          id="event-end-date"
                        type="date"

                        value={eventForm.end_date}

                        onChange={(e) =>

                            setEventForm({ ...eventForm, end_date: e.target.value })
                        }

                      />

                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-end-time">End Time</Label>
                      <Input

                          id="event-end-time"
                        type="time"

                        value={eventForm.end_time}

                        onChange={(e) =>

                            setEventForm({ ...eventForm, end_time: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-type">Event Type</Label>
                        <select
                          id="event-type"
                          value={eventForm.type}
                        onChange={(e) =>

                            setEventForm({ ...eventForm, type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="event">Event</option>
                          <option value="meeting">Meeting</option>
                          <option value="workshop">Workshop</option>
                          <option value="seminar">Seminar</option>
                          <option value="competition">Competition</option>
                          <option value="social">Social</option>
                          <option value="training">Training</option>
                          <option value="conference">Conference</option>
                        </select>
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-category">Category</Label>
                        <select
                          id="event-category"
                          value={eventForm.category}
                      onChange={(e) =>

                            setEventForm({ ...eventForm, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="General">General</option>
                          <option value="Academic">Academic</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Technical">Technical</option>
                          <option value="Social">Social</option>
                          <option value="Community">Community</option>
                          <option value="Professional">Professional</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-priority">Priority</Label>
                        <select
                          id="event-priority"
                          value={eventForm.priority}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, priority: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">

                      <Button

                        onClick={

                          editingEvent ? handleUpdateEvent : handleCreateEvent

                        }

                      >

                        {editingEvent ? "Update Event" : "Create Event"}

                      </Button>

                      <Button

                        variant="outline"

                        onClick={

                          editingEvent

                            ? handleCancelEdit

                            : () => setShowEventForm(false)

                        }

                      >

                        Cancel
                      </Button>

                    </div>

                  </CardContent>

                </Card>

              )}



              {/* Events List */}

              <div className="grid gap-4">

                {events.length === 0 ? (

                  <Card>

                    <CardContent className="text-center py-8">

                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

                      <p className="text-muted-foreground">

                        No events created yet

                      </p>

                      <p className="text-sm text-muted-foreground">
                        Create your first event to get started
                      </p>
                    </CardContent>

                  </Card>

                ) : (

                  events.map((event) => (

                    <Card key={event.id}>

                      <CardContent className="p-4">

                        <div className="flex items-start justify-between">

                          <div className="flex-1">

                            <h4 className="font-semibold text-lg">

                              {event.title}

                            </h4>

                            <p className="text-muted-foreground mb-3">

                              {event.description}

                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                              <div className="flex items-center gap-2">

                                <Calendar className="h-4 w-4 text-muted-foreground" />

                                <span>

                                  {new Date(event.start_date).toLocaleDateString()}
                                </span>

                              </div>

                              <div className="flex items-center gap-2">

                                <Clock className="h-4 w-4 text-muted-foreground" />

                                <span>

                                  {event.start_time || 'All day'}
                                </span>

                              </div>

                              <div className="flex items-center gap-2">

                                <MapPin className="h-4 w-4 text-muted-foreground" />

                                <span>{event.location || 'TBD'}</span>
                              </div>

                              <div className="flex items-center gap-2">

                                <Users className="h-4 w-4 text-muted-foreground" />

                                <span>{event.category || 'General'}</span>
                              </div>

                            </div>

                            <div className="mt-3 flex gap-2">
                              <Badge variant="outline" className="capitalize">{event.type}</Badge>
                              <Badge variant="secondary" className="capitalize">{event.category}</Badge>
                              {event.priority && (
                                <Badge variant={
                                  event.priority === 'urgent' ? 'destructive' : 
                                  event.priority === 'high' ? 'destructive' : 
                                  event.priority === 'medium' ? 'default' : 
                                  'secondary'
                                } className="capitalize">
                                  {event.priority}
                              </Badge>

                              )}
                            </div>

                          </div>

                          <div className="flex gap-2">

                            <Button

                              size="sm"

                              variant="outline"

                              onClick={() => handleEditEvent(event)}

                            >

                              <Edit className="h-4 w-4" />

                            </Button>

                            <Button

                              size="sm"

                              variant="destructive"

                              onClick={() => handleDeleteEvent(event.id)}

                            >

                              <Trash2 className="h-4 w-4" />

                            </Button>

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                  ))

                )}

              </div>

            </TabsContent>





            {/* Settings Tab */}

            <TabsContent value="settings" className="space-y-4">

              <Card>

                <CardHeader>

                  <CardTitle>Edit Club</CardTitle>

                </CardHeader>

                <CardContent className="space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="space-y-2">

                      <Label htmlFor="club-name">Name</Label>

                      <Input

                        id="club-name"

                        placeholder="Club Name"

                        value={clubForm.name}

                        onChange={(e) =>

                          setClubForm({ ...clubForm, name: e.target.value })

                        }

                      />

                    </div>

                    <div className="space-y-2">

                      <Label htmlFor="club-category">Category</Label>

                      <Select

                        value={clubForm.category}

                        onValueChange={(value) =>

                          setClubForm({ ...clubForm, category: value })

                        }

                      >

                        <SelectTrigger>

                          <SelectValue placeholder="Select category" />

                        </SelectTrigger>

                        <SelectContent>

                          {[

                            "Academic",

                            "Cultural",

                            "Sports",

                            "Technology",

                            "Arts",

                            "Community Service",

                            "Professional Development",

                            "Hobby",

                            "Other",

                          ].map((category) => (

                            <SelectItem key={category} value={category}>

                              {category}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                    <div className="md:col-span-2 space-y-2">

                      <Label htmlFor="club-desc">Description</Label>

                      <Textarea

                        id="club-desc"

                        placeholder="Describe your club..."

                        rows={4}

                        value={clubForm.description}

                        onChange={(e) =>

                          setClubForm({

                            ...clubForm,

                            description: e.target.value,

                          })

                        }

                      />

                    </div>

                    <div className="flex items-center gap-3">

                      <Switch

                        id="club-public"

                        checked={clubForm.is_public}

                        onCheckedChange={(val) =>

                          setClubForm({ ...clubForm, is_public: !!val })

                        }

                      />

                      <Label htmlFor="club-public">Public club</Label>

                    </div>

                  </div>



                  <div className="flex gap-2 pt-2">

                    <Button onClick={handleUpdateClubBasic} disabled={savingClub}>
                      {savingClub ? "Saving..." : "Save Changes"}

                    </Button>

                    <Button variant="destructive" onClick={handleDeleteClub}>

                      Delete Club

                    </Button>

                  </div>

                </CardContent>

              </Card>

            </TabsContent>

          </Tabs>

        </div>

      )}



      {/* Create New Club Modal */}

      {isSuperAdmin && showCreateClubForm && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border/50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Create New Club</h2>
                    <p className="text-sm text-muted-foreground">Set up your club with all the necessary information</p>
                  </div>
                </div>
              <Button

                variant="ghost"

                size="sm"

                onClick={() => setShowCreateClubForm(false)}

                  className="hover:bg-destructive/10 hover:text-destructive"
              >

                <X className="h-4 w-4" />

              </Button>

              </div>
            </div>



            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">

              {/* Basic Information Section */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Essential details about your club
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">

                      <Label htmlFor="new-club-name" className="text-sm font-medium">
                        Club Name *
                      </Label>
                  <Input

                    id="new-club-name"

                    placeholder="Enter club name"

                    value={newClubForm.name}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, name: e.target.value })

                    }

                        className="h-11"
                  />

                </div>

                <div className="space-y-2">

                      <Label htmlFor="new-club-category" className="text-sm font-medium">
                        Category *
                      </Label>
                  <Select

                    value={newClubForm.category}

                    onValueChange={(value) =>

                      setNewClubForm({ ...newClubForm, category: value })

                    }

                  >

                        <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />

                    </SelectTrigger>

                    <SelectContent>

                      {[

                        "Academic",

                        "Cultural",

                        "Sports",

                        "Technology",

                        "Arts",

                        "Community Service",

                        "Professional Development",

                        "Hobby",

                        "Other",

                      ].map((category) => (

                        <SelectItem key={category} value={category}>

                          {category}

                        </SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                </div>

                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-club-desc" className="text-sm font-medium">
                      Description *
                    </Label>
                  <Textarea

                    id="new-club-desc"

                    placeholder="Describe your club's purpose and activities..."

                    rows={4}

                    value={newClubForm.description}

                    onChange={(e) =>

                      setNewClubForm({

                        ...newClubForm,

                        description: e.target.value,

                      })

                    }

                      className="resize-none"
                  />

                </div>

                  
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Switch

                    id="new-club-public"

                    checked={newClubForm.is_public}

                    onCheckedChange={(val) =>

                      setNewClubForm({ ...newClubForm, is_public: !!val })

                    }

                  />

                    <div className="space-y-1">
                      <Label htmlFor="new-club-public" className="text-sm font-medium">
                        Public club
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Allow all students to view and join this club
                      </p>
                </div>

              </div>

                </CardContent>
              </Card>

              {/* Club Image Upload */}
              <ClubImageUpload
                clubImageUrl={newClubForm.club_image_url}
                onImageUpload={(imageUrl) => setNewClubForm({ ...newClubForm, club_image_url: imageUrl })}
                onImageRemove={() => setNewClubForm({ ...newClubForm, club_image_url: "" })}
              />

              {/* Club Logo Upload */}
              <ClubLogoUpload
                logoUrl={newClubForm.club_logo_url}
                onLogoUpload={(logoUrl) => {
                  setNewClubForm({ ...newClubForm, club_logo_url: logoUrl });
                }}
                onLogoRemove={() => {
                  setNewClubForm({ ...newClubForm, club_logo_url: "" });
                }}
              />
              


              {/* Department Management */}
              <DepartmentManager
                departments={newClubForm.departments_json}
                onDepartmentsChange={(departments) => setNewClubForm({ ...newClubForm, departments_json: departments })}
              />


              {/* Additional Club Information */}

              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Additional Information
                  </CardTitle>
                  <CardDescription>
                    Optional details to help students learn more about your club
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="new-club-address">Club Address</Label>

                    <Input

                      id="new-club-address"

                      placeholder="e.g., 123 University Ave, City, Country"

                      value={newClubForm.address}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, address: e.target.value })

                      }

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="new-club-location">Meeting Location</Label>

                    <Input

                      id="new-club-location"

                      placeholder="e.g., Room 201, Main Building"

                      value={newClubForm.location}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, location: e.target.value })

                      }

                    />

                  </div>

                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="new-club-meeting-day">Meeting Day</Label>

                    <Select

                      value={newClubForm.meeting_day}

                      onValueChange={(value) =>

                        setNewClubForm({ ...newClubForm, meeting_day: value })

                      }

                    >

                      <SelectTrigger>

                        <SelectValue placeholder="Select meeting day" />

                      </SelectTrigger>

                      <SelectContent>

                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (

                          <SelectItem key={day} value={day}>

                            {day}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="new-club-meeting-time">Meeting Time</Label>

                    <Input

                      id="new-club-meeting-time"

                      placeholder="e.g., 3:00 PM - 5:00 PM"

                      value={newClubForm.meeting_time}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, meeting_time: e.target.value })

                      }

                    />

                  </div>

                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="new-club-contact-email">Contact Email</Label>

                    <Input

                      id="new-club-contact-email"

                      type="email"

                      placeholder="club@university.edu"

                      value={newClubForm.contact_email}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, contact_email: e.target.value })

                      }

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="new-club-club-mail">Club Mail</Label>

                    <Input

                      id="new-club-club-mail"

                      type="email"

                      placeholder="club.official@university.edu"

                      value={newClubForm.club_mail}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, club_mail: e.target.value })

                      }

                    />

                  </div>

                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="new-club-contact-phone">Contact Phone</Label>

                    <Input

                      id="new-club-contact-phone"

                      placeholder="+880 1234-567890"

                      value={newClubForm.contact_phone}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, contact_phone: e.target.value })

                      }

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="new-club-max-members">Maximum Members</Label>

                    <Input

                      id="new-club-max-members"

                      type="number"

                      placeholder="e.g., 50"

                      value={newClubForm.max_members}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, max_members: e.target.value })

                      }

                    />

                  </div>

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-requirements">Requirements</Label>

                  <Textarea

                    id="new-club-requirements"

                    placeholder="Any prerequisites or requirements for joining"

                    rows={3}

                    value={newClubForm.requirements}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, requirements: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-details">Club Details (Extended Description)</Label>

                  <Textarea

                    id="new-club-details"

                    placeholder="Provide detailed information about the club's activities, goals, and structure..."

                    rows={4}

                    value={newClubForm.club_details}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, club_details: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-mission">Mission Statement</Label>

                  <Textarea

                    id="new-club-mission"

                    placeholder="What is the club's mission and purpose?"

                    rows={3}

                    value={newClubForm.mission_statement}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, mission_statement: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-vision">Vision Statement</Label>

                  <Textarea

                    id="new-club-vision"

                    placeholder="What is the club's vision for the future?"

                    rows={3}

                    value={newClubForm.vision_statement}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, vision_statement: e.target.value })

                    }

                  />

                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="new-club-website">Club Website</Label>

                    <Input

                      id="new-club-website"

                      type="url"

                      placeholder="https://club-website.com"

                      value={newClubForm.website}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, website: e.target.value })

                      }

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="new-club-founded">Founded Date</Label>

                    <Input

                      id="new-club-founded"

                      type="date"

                      placeholder="YYYY-MM-DD"

                      value={newClubForm.founded_date}

                      onChange={(e) =>

                        setNewClubForm({ ...newClubForm, founded_date: e.target.value })

                      }

                    />

                  </div>

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-departments">Club Departments/Teams</Label>

                  <Textarea

                    id="new-club-departments"

                    placeholder="List the main departments or teams within the club (e.g., Events Team, Marketing Team, Technical Team)"

                    rows={3}

                    value={newClubForm.departments}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, departments: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-panel">Executive Panel Members</Label>

                  <Textarea

                    id="new-club-panel"

                    placeholder="List key panel members (e.g., President: John Doe, Vice President: Jane Smith, Secretary: Bob Johnson)"

                    rows={3}

                    value={newClubForm.panel_members}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, panel_members: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-achievements">Club Achievements</Label>

                  <Textarea

                    id="new-club-achievements"

                    placeholder="List notable achievements, awards, or recognitions the club has received"

                    rows={3}

                    value={newClubForm.achievements}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, achievements: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-events">Previous Events</Label>

                  <Textarea

                    id="new-club-events"

                    placeholder="List major events or activities the club has organized in the past"

                    rows={3}

                    value={newClubForm.previous_events}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, previous_events: e.target.value })

                    }

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="new-club-social">Social Media Links</Label>

                  <Textarea

                    id="new-club-social"

                    placeholder="Facebook: https://facebook.com/club, Instagram: https://instagram.com/club, Twitter: https://twitter.com/club"

                    rows={3}

                    value={newClubForm.social_media}

                    onChange={(e) =>

                      setNewClubForm({ ...newClubForm, social_media: e.target.value })

                    }

                  />

                </div>

                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-border/50">
                <Button 
                  onClick={handleCreateClub} 
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Club

                </Button>

                <Button

                  variant="outline"

                  onClick={() => setShowCreateClubForm(false)}

                  className="flex-1 h-12"
                  size="lg"
                >

                  Cancel

                </Button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* Edit Club Modal */}
      {showEditClubForm && editingClub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Edit className="h-5 w-5 text-primary" />
    </div>

                  <div>
                    <CardTitle className="text-xl">Edit Club</CardTitle>
                    <CardDescription className="mt-1">
                      Update club information and settings
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditClubForm(false)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Basic Information Section */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Essential details about your club
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Club Name *</Label>
                      <Input
                        id="edit-name"
                        placeholder="Enter club name"
                        value={editClubForm.name}
                        onChange={(e) => setEditClubForm({ ...editClubForm, name: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select
                        value={editClubForm.category}
                        onValueChange={(value) => setEditClubForm({ ...editClubForm, category: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Cultural">Cultural</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Social">Social</SelectItem>
                          <SelectItem value="Environmental">Environmental</SelectItem>
                          <SelectItem value="Volunteer">Volunteer</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description *</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Describe your club's purpose and activities"
                      value={editClubForm.description}
                      onChange={(e) => setEditClubForm({ ...editClubForm, description: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-public"
                      checked={editClubForm.is_public}
                      onCheckedChange={(checked) => setEditClubForm({ ...editClubForm, is_public: checked })}
                    />
                    <Label htmlFor="edit-public">Make this club public</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Public clubs are visible to all users and can be joined by anyone
                  </p>
                </CardContent>
              </Card>

              {/* Club Image Upload */}
              <ClubImageUpload
                clubImageUrl={editClubForm.club_image_url}
                onImageUpload={(imageUrl) => setEditClubForm({ ...editClubForm, club_image_url: imageUrl })}
                onImageRemove={() => setEditClubForm({ ...editClubForm, club_image_url: "" })}
              />

              {/* Club Logo Upload */}
              <ClubLogoUpload
                logoUrl={editClubForm.club_logo_url}
                onLogoUpload={(logoUrl) => {
                  setEditClubForm({ ...editClubForm, club_logo_url: logoUrl });
                }}
                onLogoRemove={() => {
                  setEditClubForm({ ...editClubForm, club_logo_url: "" });
                }}
              />

              {/* Department Management */}
              <DepartmentManager
                departments={editClubForm.departments_json}
                onDepartmentsChange={(departments) => setEditClubForm({ ...editClubForm, departments_json: departments })}
              />

              {/* Awards Management */}
              {editingClub && (
                <AwardsManager
                  clubId={editingClub.id}
                  awards={clubAwards}
                  onAwardsChange={setClubAwards}
                />
              )}



              {/* Additional Club Information */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Additional Information
                  </CardTitle>
                  <CardDescription>
                    Optional details to enhance your club profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-website">Website</Label>
                      <Input
                        id="edit-website"
                        placeholder="https://yourclub.com"
                        value={editClubForm.website}
                        onChange={(e) => setEditClubForm({ ...editClubForm, website: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-social">Social Media</Label>
                      <Input
                        id="edit-social"
                        placeholder="@yourclub"
                        value={editClubForm.social_media}
                        onChange={(e) => setEditClubForm({ ...editClubForm, social_media: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-founded">Founded Date</Label>
                      <Input
                        id="edit-founded"
                        type="date"
                        value={editClubForm.founded_date}
                        onChange={(e) => setEditClubForm({ ...editClubForm, founded_date: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-members">Max Members</Label>
                      <Input
                        id="edit-max-members"
                        type="number"
                        placeholder="50"
                        value={editClubForm.max_members}
                        onChange={(e) => setEditClubForm({ ...editClubForm, max_members: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-mission">Mission Statement</Label>
                    <Textarea
                      id="edit-mission"
                      placeholder="What is your club's mission?"
                      value={editClubForm.mission_statement}
                      onChange={(e) => setEditClubForm({ ...editClubForm, mission_statement: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-vision">Vision Statement</Label>
                    <Textarea
                      id="edit-vision"
                      placeholder="What is your club's vision for the future?"
                      value={editClubForm.vision_statement}
                      onChange={(e) => setEditClubForm({ ...editClubForm, vision_statement: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-requirements">Requirements</Label>
                    <Textarea
                      id="edit-requirements"
                      placeholder="Any special requirements to join this club?"
                      value={editClubForm.requirements}
                      onChange={(e) => setEditClubForm({ ...editClubForm, requirements: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    How people can get in touch with your club
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-contact-email">Contact Email</Label>
                      <Input
                        id="edit-contact-email"
                        type="email"
                        placeholder="contact@yourclub.com"
                        value={editClubForm.contact_email}
                        onChange={(e) => setEditClubForm({ ...editClubForm, contact_email: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-club-mail">Club Email</Label>
                      <Input
                        id="edit-club-mail"
                        type="email"
                        placeholder="club@yourclub.com"
                        value={editClubForm.club_mail}
                        onChange={(e) => setEditClubForm({ ...editClubForm, club_mail: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        placeholder="+1 (555) 123-4567"
                        value={editClubForm.contact_phone}
                        onChange={(e) => setEditClubForm({ ...editClubForm, contact_phone: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <Input
                        id="edit-location"
                        placeholder="Room 101, Building A"
                        value={editClubForm.location}
                        onChange={(e) => setEditClubForm({ ...editClubForm, location: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      placeholder="Full address of your club"
                      value={editClubForm.address}
                      onChange={(e) => setEditClubForm({ ...editClubForm, address: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Meeting Information */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Meeting Information
                  </CardTitle>
                  <CardDescription>
                    When and where your club meets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-meeting-day">Meeting Day</Label>
                      <Select
                        value={editClubForm.meeting_day}
                        onValueChange={(value) => setEditClubForm({ ...editClubForm, meeting_day: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-meeting-time">Meeting Time</Label>
                      <Input
                        id="edit-meeting-time"
                        type="time"
                        value={editClubForm.meeting_time}
                        onChange={(e) => setEditClubForm({ ...editClubForm, meeting_time: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Modal Footer */}
            <div className="bg-muted/30 border-t border-border/50 p-6 flex-shrink-0">
              <div className="flex gap-3">
                <Button
                  onClick={handleUpdateClub}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg text-white font-semibold"
                  size="lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Club
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditClubForm(false)}
                  className="flex-1 h-12"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );

};



export default ClubDashboard;