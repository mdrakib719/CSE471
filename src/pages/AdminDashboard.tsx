 import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Settings,
  Clock,
  GraduationCap,
  LayoutDashboard,
  UserCog,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  MoreVertical,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useStudentsFromUsers,
  useStudentStatistics,
} from "@/hooks/useStudentsFromUsers";
import EventManagement from "@/components/EventManagement";
import ClubManagement from "@/components/ClubManagement";
import { useUserManagement } from "@/hooks/useUserManagement";
import emailjs from "emailjs-com";
import { supabase } from "@/lib/supabase";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // User management state
  const [userFilter, setUserFilter] = useState<
    "all" | "pending" | "approved" | "suspended"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // User management hook
  const {
    users,
    loading: usersLoading,
    error: usersError,
    approveUser,
    suspendUser,
    deleteUser,
    updateUserRole,
    getFilteredUsers,
    getUserStats,
    refetch: refetchUsers,
  } = useUserManagement();

  // Students management hook
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    searchStudents,
    filterByDepartment,
    filterByStatus,
    deleteStudent,
    refetch: refetchStudents,
  } = useStudentsFromUsers();

  const { statistics: studentStats, loading: studentStatsLoading } =
    useStudentStatistics();

  // Ensure studentStats has default values
  const safeStudentStats = studentStats || {
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    approved: 0,
    byDepartment: {},
  };

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeClubs: 34,
    totalEvents: 89,
    activeUsers: 1200, // Changed from pendingApprovals to activeUsers
  };

  const recentUsers = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@university.edu",
      department: "Computer Science",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@university.edu",
      department: "Engineering",
      joinDate: "2024-01-14",
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol@university.edu",
      department: "Business",
      joinDate: "2024-01-13",
    },
  ];

  // User management handlers
  const handleApproveUser = async (userId: string, userName: string) => {
    const result = await approveUser(userId);
    if (result.success) {
      toast({
        title: "User Approved",
        description: `${userName} has been approved successfully.`,
      });
    } else {
      toast({
        title: "Approval Failed",
        description: result.error || "Failed to approve user.",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string, userName: string) => {
    const result = await suspendUser(userId);
    if (result.success) {
      toast({
        title: "User Suspended",
        description: `${userName} has been suspended.`,
      });
    } else {
      toast({
        title: "Suspension Failed",
        description: result.error || "Failed to suspend user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const result = await deleteUser(userId);
    if (result.success) {
      toast({
        title: "User Deleted",
        description: `${userName} has been deleted permanently.`,
      });
    } else {
      toast({
        title: "Deletion Failed",
        description: result.error || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "student" | "faculty" | "admin",
    userName: string
  ) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast({
        title: "Role Updated",
        description: `${userName}'s role has been updated to ${newRole}.`,
      });
    } else {
      toast({
        title: "Role Update Failed",
        description: result.error || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  // Filter and search users
  const filteredUsers = getFilteredUsers(userFilter).filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userStats = getUserStats() || {
    total: 0,
    pending: 0,
    approved: 0,
    suspended: 0,
    students: 0,
    faculty: 0,
    admins: 0,
  };

  // AI Mail Generator state
  const [emailPrompt, setEmailPrompt] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");

  // Notifications state
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedNotificationRecipients, setSelectedNotificationRecipients] =
    useState<string[]>([]);

  // Clubs management state
  const [clubs, setClubs] = useState<any[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [showAddClubForm, setShowAddClubForm] = useState(false);
  const [editingClub, setEditingClub] = useState<any>(null);
  const [clubFormData, setClubFormData] = useState({
    name: "",
    description: "",
    category: "",
    meeting_time: "",
    meeting_location: "",
    max_members: "",
    requirements: "",
  });

  // Club admin assignment state
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [selectedClubForAdmin, setSelectedClubForAdmin] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const [showRemoveAllAdminsModal, setShowRemoveAllAdminsModal] =
    useState(false);

  // Club categories
  const clubCategories = [
    "Academic",
    "Cultural",
    "Sports",
    "Technology",
    "Arts",
    "Community Service",
    "Professional Development",
    "Hobby",
    "Other",
  ];

  const notificationOptions = [
    "New Event Available",
    "Join New Club - Registration Open",
    "Exam Schedule Released",
    "Holiday Announcement",
    "Academic Calendar Update",
    "Important Deadline Reminder",
    "Course Registration Open",
    "Library Hours Changed",
    "Campus Facility Update",
    "Student Services Announcement",
    "Scholarship Opportunity",
    "Career Fair Announcement",
  ];

  // Fetch clubs from database
  const fetchClubs = async () => {
    try {
      setClubsLoading(true);
      setClubsError(null);

      // First fetch clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from("clubs")
        .select("*")
        .order("created_at", { ascending: false });

      if (clubsError) {
        console.error("Error fetching clubs:", clubsError);
        setClubsError(clubsError.message);
        return;
      }

      // Then fetch admin information for each club
      const clubsWithAdminInfo = await Promise.all(
        (clubsData || []).map(async (club) => {
          // First check if there's a user assigned as club admin
          try {
            const { data: clubAdminData, error: clubAdminError } =
              await supabase
                .from("users")
                .select("full_name, email")
                .eq("club_admin", club.id)
                .single();

            if (!clubAdminError && clubAdminData) {
              return {
                ...club,
                admin_name: clubAdminData.full_name,
                admin_email: clubAdminData.email,
                admin_source: "club_admin",
              };
            }
          } catch (err) {
            // No club admin assigned, check created_by as fallback
          }

          // Fallback to created_by if no club admin assigned
          if (club.created_by) {
            try {
              const { data: adminData, error: adminError } = await supabase
                .from("users")
                .select("full_name, email")
                .eq("id", club.created_by)
                .single();

              if (!adminError && adminData) {
                return {
                  ...club,
                  admin_name: adminData.full_name,
                  admin_email: adminData.email,
                  admin_source: "created_by",
                };
              }
            } catch (err) {
              console.warn("Could not fetch admin info for club:", club.id);
            }
          }

          return {
            ...club,
            admin_name: "Unassigned",
            admin_email: null,
            admin_source: "none",
          };
        })
      );

      console.log("Clubs with admin info:", clubsWithAdminInfo);
      setClubs(clubsWithAdminInfo);
    } catch (err) {
      console.error("Error in fetchClubs:", err);
      setClubsError(
        err instanceof Error ? err.message : "Failed to fetch clubs"
      );
    } finally {
      setClubsLoading(false);
    }
  };

  // Add new club
  const handleAddClub = async () => {
    try {
      const newClub = {
        ...clubFormData,
        max_members: parseInt(clubFormData.max_members) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("clubs")
        .insert([newClub])
        .select()
        .single();

      if (error) {
        console.error("Error creating club:", error);
        throw new Error(error.message);
      }

      // Update local state
      setClubs((prev) => [data, ...prev]);
      setShowAddClubForm(false);
      setClubFormData({
        name: "",
        description: "",
        category: "",
        meeting_time: "",
        meeting_location: "",
        max_members: "",
        requirements: "",
      });

      toast({
        title: "Club Created",
        description: `${data.name} has been created successfully.`,
      });
    } catch (err) {
      console.error("Error in handleAddClub:", err);
      toast({
        title: "Error Creating Club",
        description:
          err instanceof Error ? err.message : "Failed to create club",
        variant: "destructive",
      });
    }
  };

  // Update club
  const handleUpdateClub = async () => {
    if (!editingClub) return;

    try {
      const updatedClub = {
        ...clubFormData,
        max_members: parseInt(clubFormData.max_members) || 0,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("clubs")
        .update(updatedClub)
        .eq("id", editingClub.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating club:", error);
        throw new Error(error.message);
      }

      // Update local state
      setClubs((prev) =>
        prev.map((club) => (club.id === editingClub.id ? data : club))
      );
      setEditingClub(null);
      setClubFormData({
        name: "",
        description: "",
        category: "",
        meeting_time: "",
        meeting_location: "",
        max_members: "",
        requirements: "",
      });

      toast({
        title: "Club Updated",
        description: `${data.name} has been updated successfully.`,
      });
    } catch (err) {
      console.error("Error in handleUpdateClub:", err);
      toast({
        title: "Error Updating Club",
        description:
          err instanceof Error ? err.message : "Failed to update club",
        variant: "destructive",
      });
    }
  };

  // Delete club
  const handleDeleteClub = async (clubId: string, clubName: string) => {
    try {
      const { error } = await supabase.from("clubs").delete().eq("id", clubId);

      if (error) {
        console.error("Error deleting club:", error);
        throw new Error(error.message);
      }

      // Update local state
      setClubs((prev) => prev.filter((club) => club.id !== clubId));

      toast({
        title: "Club Deleted",
        description: `${clubName} has been deleted successfully.`,
      });
    } catch (err) {
      console.error("Error in handleDeleteClub:", err);
      toast({
        title: "Error Deleting Club",
        description:
          err instanceof Error ? err.message : "Failed to delete club",
        variant: "destructive",
      });
    }
  };

  // Edit club handler
  const handleEditClub = (club: any) => {
    setEditingClub(club);
    setClubFormData({
      name: club.name || "",
      description: club.description || "",
      category: club.category || "",
      meeting_time: club.meeting_time || "",
      meeting_location: club.meeting_location || "",
      max_members: club.max_members?.toString() || "",
      requirements: club.requirements || "",
    });
  };

  // Cancel edit/add
  const handleCancelClub = () => {
    setEditingClub(null);
    setShowAddClubForm(false);
    setClubFormData({
      name: "",
      description: "",
      category: "",
      meeting_time: "",
      meeting_location: "",
      max_members: "",
      requirements: "",
    });
  };

  // Club admin assignment functions
  const handleAssignClubAdmin = async (club: any) => {
    setSelectedClubForAdmin(club);
    setShowAssignAdminModal(true);

    // Fetch available users for admin assignment
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, department")
        .in("role", ["student", "faculty"])
        .eq("user_status", "active");

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch available users",
          variant: "destructive",
        });
        return;
      }

      setAvailableUsers(users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error",
        description: "Failed to fetch available users",
        variant: "destructive",
      });
    }
  };

  const assignAdminToClub = async (userId: string, userName: string) => {
    if (!selectedClubForAdmin) return;

    try {
      setAssigningAdmin(true);

      // First, update the user's club_admin field in users table
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          club_admin: selectedClubForAdmin.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (userUpdateError) {
        console.error("Error updating user club_admin:", userUpdateError);
        toast({
          title: "Error",
          description: "Failed to assign club admin",
          variant: "destructive",
        });
        return;
      }

      // Then, update the club with the new admin
      const { error: clubUpdateError } = await supabase
        .from("clubs")
        .update({
          created_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedClubForAdmin.id);

      if (clubUpdateError) {
        console.error("Error updating club created_by:", clubUpdateError);
        toast({
          title: "Error",
          description: "Failed to assign club admin",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setClubs((prev) =>
        prev.map((club) =>
          club.id === selectedClubForAdmin.id
            ? { ...club, created_by: userId }
            : club
        )
      );

      toast({
        title: "Success",
        description: `${userName} has been assigned as admin for ${selectedClubForAdmin.name}`,
      });

      // Refresh user data if the assigned user is the current user
      if (userId === user?.id) {
        // Import refreshUser from useAuth hook context
        window.location.reload(); // Simple way to refresh - can be improved
        console.log(
          "Current user's club admin data will be refreshed on reload"
        );
      }

      setShowAssignAdminModal(false);
      setSelectedClubForAdmin(null);
    } catch (err) {
      console.error("Error assigning admin:", err);
      toast({
        title: "Error",
        description: "Failed to assign club admin",
        variant: "destructive",
      });
    } finally {
      setAssigningAdmin(false);
    }
  };

  // Remove club admin assignment
  const removeClubAdmin = async (clubId: string, clubName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove the club admin from "${clubName}"?`
      )
    ) {
      return;
    }

    try {
      setAssigningAdmin(true);

      // First, find the current club admin
      const { data: clubData, error: clubError } = await supabase
        .from("clubs")
        .select("created_by")
        .eq("id", clubId)
        .single();

      if (clubError || !clubData) {
        console.error("Error fetching club data:", clubError);
        toast({
          title: "Error",
          description: "Failed to fetch club data",
          variant: "destructive",
        });
        return;
      }

      const currentAdminId = clubData.created_by;

      if (!currentAdminId) {
        toast({
          title: "No Admin",
          description: "This club has no assigned admin to remove",
          variant: "destructive",
        });
        return;
      }

      // Remove club_admin from the user
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          club_admin: null,
          updated_at: new Date().toISOString(),
        })
        .eq("club_admin", clubId);

      if (userUpdateError) {
        console.error("Error removing club_admin from user:", userUpdateError);
        toast({
          title: "Error",
          description: "Failed to remove club admin",
          variant: "destructive",
        });
        return;
      }

      // Clear the club's created_by field (optional - you can keep the original creator)
      const { error: clubUpdateError } = await supabase
        .from("clubs")
        .update({
          created_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clubId);

      if (clubUpdateError) {
        console.error("Error clearing club created_by:", clubUpdateError);
        // Don't fail the entire operation for this
        console.warn("Club created_by field could not be cleared");
      }

      // Update local state
      setClubs((prev) =>
        prev.map((club) =>
          club.id === clubId
            ? {
                ...club,
                created_by: null,
                admin_name: "Unassigned",
                admin_email: null,
                admin_source: "none",
              }
            : club
        )
      );

      toast({
        title: "Success",
        description: `Club admin has been removed from ${clubName}`,
      });

      // Refresh the clubs list to show updated admin info
      fetchClubs();

      setAssigningAdmin(false);
    } catch (err) {
      console.error("Error removing club admin:", err);
      toast({
        title: "Error",
        description: "Failed to remove club admin",
        variant: "destructive",
      });
      setAssigningAdmin(false);
    }
  };

  const closeAssignAdminModal = () => {
    setShowAssignAdminModal(false);
    setSelectedClubForAdmin(null);
    setAvailableUsers([]);
  };

  // Remove all club admin assignments
  const removeAllClubAdmins = async () => {
    if (
      !confirm(
        "Are you sure you want to remove ALL club admin assignments? This will make all clubs unassigned."
      )
    ) {
      return;
    }

    try {
      setAssigningAdmin(true);

      // Remove club_admin from all users
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          club_admin: null,
          updated_at: new Date().toISOString(),
        })
        .not("club_admin", "is", null);

      if (userUpdateError) {
        console.error(
          "Error removing all club_admin assignments:",
          userUpdateError
        );
        toast({
          title: "Error",
          description: "Failed to remove all club admin assignments",
          variant: "destructive",
        });
        return;
      }

      // Clear created_by from all clubs
      const { error: clubUpdateError } = await supabase
        .from("clubs")
        .update({
          created_by: null,
          updated_at: new Date().toISOString(),
        })
        .not("created_by", "is", null);

      if (clubUpdateError) {
        console.error(
          "Error clearing all club created_by fields:",
          clubUpdateError
        );
        // Don't fail the entire operation for this
        console.warn("Some club created_by fields could not be cleared");
      }

      // Update local state
      setClubs((prev) =>
        prev.map((club) => ({
          ...club,
          created_by: null,
          admin_name: "Unassigned",
          admin_email: null,
          admin_source: "none",
        }))
      );

      toast({
        title: "Success",
        description: "All club admin assignments have been removed",
      });

      // Refresh the clubs list
      fetchClubs();

      setShowRemoveAllAdminsModal(false);
      setAssigningAdmin(false);
    } catch (err) {
      console.error("Error removing all club admins:", err);
      toast({
        title: "Error",
        description: "Failed to remove all club admin assignments",
        variant: "destructive",
      });
      setAssigningAdmin(false);
    }
  };

  // Load clubs and events on component mount
  useEffect(() => {
    fetchClubs();
    fetchEvents();
  }, []);

  // Events management state
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    location: "",
    max_participants: "",
    event_type: "",
    organizer: "",
    contact_email: "",
    registration_deadline: "",
  });

  // Event types
  const eventTypes = [
    "Academic",
    "Cultural",
    "Sports",
    "Workshop",
    "Seminar",
    "Conference",
    "Social",
    "Career Fair",
    "Orientation",
    "Other",
  ];

  // Fetch events from database
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      setEventsError(null);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        setEventsError(error.message);
        return;
      }

      console.log("Events fetched:", data);
      setEvents(data || []);
    } catch (err) {
      console.error("Error in fetchEvents:", err);
      setEventsError(
        err instanceof Error ? err.message : "Failed to fetch events"
      );
    } finally {
      setEventsLoading(false);
    }
  };

  // Send notification to club members
  const sendEventNotificationToClubMembers = async (
    eventData: any,
    clubId?: string
  ) => {
    try {
      if (!clubId) return;

      console.log(
        "Sending notifications to club members for event:",
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

  // Add new event
  const handleAddEvent = async () => {
    try {
      const newEvent = {
        ...eventFormData,
        max_participants: parseInt(eventFormData.max_participants) || 0,
        created_by: user?.id, // Add the current user's ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("events")
        .insert([newEvent])
        .select()
        .single();

      if (error) {
        console.error("Error creating event:", error);
        throw new Error(error.message);
      }

      // Update local state
      setEvents((prev) => [data, ...prev]);

      // Send notifications to club members if event is associated with a club
      if (data.club_id) {
        await sendEventNotificationToClubMembers(data, data.club_id);
      }

      setShowAddEventForm(false);
      setEventFormData({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
        location: "",
        max_participants: "",
        event_type: "",
        organizer: "",
        contact_email: "",
        registration_deadline: "",
      });

      toast({
        title: "Event Created",
        description: `${data.title} has been created successfully${
          data.club_id ? " and notifications sent to club members" : ""
        }.`,
      });
    } catch (err) {
      console.error("Error in handleAddEvent:", err);
      toast({
        title: "Error Creating Event",
        description:
          err instanceof Error ? err.message : "Failed to create event",
        variant: "destructive",
      });
    }
  };

  // Update event
  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    try {
      const updatedEvent = {
        ...eventFormData,
        max_participants: parseInt(eventFormData.max_participants) || 0,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("events")
        .update(updatedEvent)
        .eq("id", editingEvent.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating event:", error);
        throw new Error(error.message);
      }

      // Update local state
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEvent.id ? data : event))
      );
      setEditingEvent(null);
      setEventFormData({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
        location: "",
        max_participants: "",
        event_type: "",
        organizer: "",
        contact_email: "",
        registration_deadline: "",
      });

      toast({
        title: "Event Updated",
        description: `${data.title} has been updated successfully.`,
      });
    } catch (err) {
      console.error("Error in handleUpdateEvent:", err);
      toast({
        title: "Error Updating Event",
        description:
          err instanceof Error ? err.message : "Failed to update event",
        variant: "destructive",
      });
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting event:", error);
        throw new Error(error.message);
      }

      // Update local state
      setEvents((prev) => prev.filter((event) => event.id !== eventId));

      toast({
        title: "Event Deleted",
        description: `${eventTitle} has been deleted successfully.`,
      });
    } catch (err) {
      console.error("Error in handleDeleteEvent:", err);
      toast({
        title: "Error Deleting Event",
        description:
          err instanceof Error ? err.message : "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  // Edit event handler
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventFormData({
      title: event.title || "",
      description: event.description || "",
      start_at: event.start_at || "",
      end_at: event.end_at || "",
      location: event.location || "",
      max_participants: event.max_participants?.toString() || "",
      event_type: event.event_type || "",
      organizer: event.organizer || "",
      contact_email: event.contact_email || "",
      registration_deadline: event.registration_deadline || "",
    });
  };

  // Cancel edit/add
  const handleCancelEvent = () => {
    setEditingEvent(null);
    setShowAddEventForm(false);
    setEventFormData({
      title: "",
      description: "",
      start_at: "",
      end_at: "",
      location: "",
      max_participants: "",
      event_type: "",
      organizer: "",
      contact_email: "",
      registration_deadline: "",
    });
  };

  const handleGenerateEmail = async () => {
    if (!emailPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter what you want the email to be about.",
        variant: "destructive",
      });
      return;
    }
    setEmailLoading(true);
    setGeneratedEmail("");
    try {
      const { CohereClientV2 } = await import("cohere-ai");
      const cohere = new CohereClientV2({
        token: "WXLRaDQGGcSLekKzhkd3S653Iwo4PX6LfU3wUeAF",
      });
      const response = await cohere.chat({
        model: "command-a-03-2025",
        messages: [
          {
            role: "user",
            content: `Write a professional email for this scenario: ${emailPrompt}`,
          },
        ],
      });
      setGeneratedEmail(
        (response.message?.content?.[0]?.text as string) ||
          (response.text as string) ||
          (response.generations?.[0]?.text as string) ||
          "No email generated."
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate email.",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailToAllStudents = async () => {
    if (!generatedEmail) {
      toast({
        title: "No Email Content",
        description: "Please generate the email content first.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;
    for (const student of students) {
      try {
        await emailjs.send(
          "service_w0yrqzx",
          "template_nu1blhd",
          {
            to_name: student.full_name,
            to_email: student.email,
            message: generatedEmail,
          },
          "5z5hG6uOfJfySVK-U"
        );
        successCount++;
      } catch (err: any) {
        console.error("Email send failed:", err?.text || err);
        failCount++;
      }
    }

    toast({
      title: "Email Sending Complete",
      description: `${successCount} sent, ${failCount} failed.`,
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const updateNotificationForSelected = async (
    message: string,
    userIds: string[]
  ) => {
    if (userIds.length === 0) {
      throw new Error("No recipients selected");
    }
    const notification = {
      id: Date.now().toString(),
      title: "Student Management Notification",
      message,
      type: "info",
      timestamp: new Date().toISOString(),
      read: false,
    };

    const { data: targetUsers, error: fetchError } = await supabase
      .from("users")
      .select("id, notifications")
      .in("id", userIds)
      .eq("role", "student");
    if (fetchError) throw new Error(fetchError.message);
    if (!targetUsers || targetUsers.length === 0)
      throw new Error("No matching students found");

    const updates = targetUsers.map((u: any) => {
      const current = u.notifications || [];
      const updated = [notification, ...current];
      return supabase
        .from("users")
        .update({ notifications: updated })
        .eq("id", u.id);
    });
    const results = await Promise.all(updates);
    const errors = results.filter((r: any) => r.error);
    if (errors.length > 0)
      throw new Error(`Failed to update ${errors.length} users`);
  };

  const updateNotificationForAll = async (message: string) => {
    const notification = {
      id: Date.now().toString(),
      title: "Student Management Notification",
      message,
      type: "info",
      timestamp: new Date().toISOString(),
      read: false,
    };
    const { data: targetUsers, error: fetchError } = await supabase
      .from("users")
      .select("id, notifications")
      .eq("role", "student");
    if (fetchError) throw new Error(fetchError.message);
    if (!targetUsers || targetUsers.length === 0)
      throw new Error("No students found");

    const updates = targetUsers.map((u: any) => {
      const current = u.notifications || [];
      const updated = [notification, ...current];
      return supabase
        .from("users")
        .update({ notifications: updated })
        .eq("id", u.id);
    });
    const results = await Promise.all(updates);
    const errors = results.filter((r: any) => r.error);
    if (errors.length > 0)
      throw new Error(`Failed to update ${errors.length} students`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "suspended":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 pt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "users", label: "Users", icon: UserCog },
    { id: "clubs", label: "Clubs", icon: Shield },
    { id: "events", label: "Events", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-card/50 backdrop-blur-sm border-r border-border/40 min-h-screen shadow-lg">
            <div className="p-6 border-b border-border/40">
              <h2 className="text-xl font-bold text-foreground">
                Admin Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">Manage platform</p>
            </div>
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {sidebarItems.find((item) => item.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === "overview" &&
                  "Dashboard overview and quick actions"}
                {activeTab === "students" &&
                  "Manage student data and information"}
                {activeTab === "users" &&
                  "Manage registered users and permissions"}
                {activeTab === "clubs" && "Approve and manage student clubs"}
                {activeTab === "events" &&
                  "Oversee university events and activities"}
                {activeTab === "analytics" &&
                  "View platform analytics and statistics"}
                {activeTab === "settings" && "Configure platform settings"}
              </p>
            </div>

            {/* Overview Section */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Users
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {stats.totalUsers}
                          </p>
                          <p className="text-xs text-success">
                            +12% from last month
                          </p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Active Clubs
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {stats.activeClubs}
                          </p>
                          <p className="text-xs text-success">
                            +3 new this month
                          </p>
                        </div>
                        <div className="bg-accent/10 p-3 rounded-lg">
                          <Shield className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Events
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {stats.totalEvents}
                          </p>
                          <p className="text-xs text-success">+8 this week</p>
                        </div>
                        <div className="bg-warning/10 p-3 rounded-lg">
                          <Calendar className="h-6 w-6 text-warning" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Active Users
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {stats.activeUsers}
                          </p>
                          <p className="text-xs text-success">All verified</p>
                        </div>
                        <div className="bg-success/10 p-3 rounded-lg">
                          <UserCheck className="h-6 w-6 text-success" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          {
                            action: "New club application",
                            time: "2 hours ago",
                            type: "club",
                          },
                          {
                            action: "Event registration opened",
                            time: "4 hours ago",
                            type: "event",
                          },
                          {
                            action: "New user registered",
                            time: "6 hours ago",
                            type: "user",
                          },
                          {
                            action: "Club meeting scheduled",
                            time: "1 day ago",
                            type: "meeting",
                          },
                        ].map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {activity.action}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="h-20 flex-col space-y-2"
                          onClick={() => setActiveTab("clubs")}
                        >
                          <Plus className="h-5 w-5" />
                          <span className="text-sm">Add New Club</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex-col space-y-2"
                          onClick={() => setActiveTab("events")}
                        >
                          <Calendar className="h-5 w-5" />
                          <span className="text-sm">Create Event</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex-col space-y-2"
                          onClick={() => setActiveTab("students")}
                        >
                          <GraduationCap className="h-5 w-5" />
                          <span className="text-sm">Manage Students</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex-col space-y-2"
                          onClick={() => setActiveTab("analytics")}
                        >
                          <BarChart3 className="h-5 w-5" />
                          <span className="text-sm">View Analytics</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Students Section */}
            {activeTab === "students" && (
              <div className="space-y-6">
                {/* AI Email Generator */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Email Generator</CardTitle>
                    <CardDescription>
                      Generate a professional email and send to all students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2 items-start">
                        <Input
                          placeholder="Describe the email you want to generate..."
                          value={emailPrompt}
                          onChange={(e) => setEmailPrompt(e.target.value)}
                        />
                        <Button
                          onClick={handleGenerateEmail}
                          disabled={emailLoading}
                        >
                          {emailLoading ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                      <div>
                        <Label className="mb-1 block">Generated Email</Label>
                        <textarea
                          className="w-full border rounded p-3 h-40"
                          value={generatedEmail}
                          onChange={(e) => setGeneratedEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={handleSendEmailToAllStudents}
                          disabled={!generatedEmail}
                        >
                          Send to All Students
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Send notifications to selected students or everyone
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <select
                          className="border rounded px-3 py-2"
                          value={notificationMessage}
                          onChange={(e) =>
                            setNotificationMessage(e.target.value)
                          }
                        >
                          <option value="">Select Notification</option>
                          {notificationOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            if (
                              !notificationMessage ||
                              selectedNotificationRecipients.length === 0
                            ) {
                              toast({
                                title: "Select Recipients and Notification",
                                description:
                                  "Please select at least one recipient and a notification message.",
                                variant: "destructive",
                              });
                              return;
                            }
                            try {
                              await updateNotificationForSelected(
                                notificationMessage,
                                selectedNotificationRecipients
                              );
                              toast({
                                title: "Notification Sent",
                                description: `Notification "${notificationMessage}" sent to selected students.`,
                              });
                              setNotificationMessage("");
                              setSelectedNotificationRecipients([]);
                            } catch (error: any) {
                              toast({
                                title: "Error Sending Notification",
                                description:
                                  error?.message ||
                                  "Failed to send notification.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={
                            !notificationMessage ||
                            selectedNotificationRecipients.length === 0
                          }
                        >
                          Send to Selected
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            if (!notificationMessage) {
                              toast({
                                title: "No Notification Selected",
                                description:
                                  "Please select a notification message to send.",
                                variant: "destructive",
                              });
                              return;
                            }
                            try {
                              await updateNotificationForAll(
                                notificationMessage
                              );
                              toast({
                                title: "Notification Sent",
                                description: `Notification "${notificationMessage}" sent to all students.`,
                              });
                              setNotificationMessage("");
                              setSelectedNotificationRecipients([]);
                            } catch (error: any) {
                              toast({
                                title: "Error Sending Notification",
                                description:
                                  error?.message ||
                                  "Failed to send notification.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={!notificationMessage}
                        >
                          Send to All
                        </Button>
                      </div>

                      {/* Recipient selector */}
                      <div className="max-h-48 overflow-auto border rounded px-3 py-2 text-sm w-full">
                        <p className="font-semibold mb-2">Select Recipients:</p>
                        {students.length === 0 ? (
                          <p className="text-muted-foreground">
                            No students available
                          </p>
                        ) : (
                          students.map((student) => (
                            <label
                              key={student.id}
                              className="flex items-center gap-2 mb-1 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                value={student.id}
                                checked={selectedNotificationRecipients.includes(
                                  student.id
                                )}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  setSelectedNotificationRecipients((prev) =>
                                    e.target.checked
                                      ? [...prev, id]
                                      : prev.filter((sid) => sid !== id)
                                  );
                                }}
                              />
                              <span>
                                {student.full_name} (
                                {student.student_id || "No ID"})
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Student Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Students
                          </p>
                          <p className="text-2xl font-bold">
                            {safeStudentStats.total}
                          </p>
                        </div>
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Active Students
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {safeStudentStats.active}
                          </p>
                        </div>
                        <UserCheck className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Pending
                          </p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {safeStudentStats.pending}
                          </p>
                        </div>
                        <Clock className="h-6 w-6 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Departments
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {Object.keys(safeStudentStats.byDepartment).length}
                          </p>
                        </div>
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Student Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>
                      Manage all registered students, view details, and update
                      information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filters and Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search students by name, email, or student ID..."
                          className="pl-10"
                          onChange={(e) => searchStudents(e.target.value)}
                        />
                      </div>
                      <Select onValueChange={filterByDepartment}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {Array.from(
                            new Set(
                              students.map((s) => s.department).filter(Boolean)
                            )
                          ).map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select onValueChange={filterByStatus}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Students Table */}
                    {studentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">
                          Loading students...
                        </p>
                      </div>
                    ) : studentsError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600">Error: {studentsError}</p>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-8">
                        <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                          No students found
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          No students are currently registered in the system.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">
                                Student ID
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Email
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Department
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Year
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Joined Date
                              </th>
                              <th className="text-right py-3 px-4 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student) => (
                              <tr
                                key={student.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {student.student_id || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  {student.full_name}
                                </td>
                                <td className="py-3 px-4">
                                  <a
                                    href={`mailto:${student.email}`}
                                    className="text-inherit no-underline hover:text-primary"
                                  >
                                    {student.email}
                                  </a>
                                </td>
                                <td className="py-3 px-4">
                                  {student.department || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  {student.year || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant={
                                      (student.status || "pending") === "active"
                                        ? "default"
                                        : (student.status || "pending") ===
                                          "pending"
                                        ? "outline"
                                        : (student.status || "pending") ===
                                          "approved"
                                        ? "default"
                                        : (student.status || "pending") ===
                                          "suspended"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {(student.status || "pending")
                                      .charAt(0)
                                      .toUpperCase() +
                                      (student.status || "pending").slice(1)}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  {new Date(
                                    student.created_at
                                  ).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Handle edit student
                                        toast({
                                          title: "Edit Student",
                                          description:
                                            "Edit functionality coming soon!",
                                        });
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Student
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete{" "}
                                            {student.full_name}? This action
                                            cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              deleteStudent(student.id)
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Section */}
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Users
                          </p>
                          <p className="text-2xl font-bold">
                            {userStats.total}
                          </p>
                        </div>
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Pending
                          </p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {userStats.pending}
                          </p>
                        </div>
                        <Clock className="h-6 w-6 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Approved
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {userStats.approved}
                          </p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Suspended
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {userStats.suspended}
                          </p>
                        </div>
                        <XCircle className="h-6 w-6 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage all registered users, approve accounts, and update
                      permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filters and Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users by name, email, or student ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select
                        value={userFilter}
                        onValueChange={(value: any) => setUserFilter(value)}
                      >
                        <SelectTrigger className="w-full md:w-48">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All Users ({userStats.total})
                          </SelectItem>
                          <SelectItem value="pending">
                            Pending ({userStats.pending})
                          </SelectItem>
                          <SelectItem value="approved">
                            Approved ({userStats.approved})
                          </SelectItem>
                          <SelectItem value="suspended">
                            Suspended ({userStats.suspended})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={refetchUsers}>
                        Refresh
                      </Button>
                    </div>

                    {/* Users List */}
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Clock className="h-6 w-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    ) : usersError ? (
                      <div className="text-center py-8 text-red-500">
                        Error loading users: {usersError}
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      <div className="space-y-4">
                        {filteredUsers.map((dbUser) => (
                          <div
                            key={dbUser.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarFallback>
                                  {(dbUser.full_name || dbUser.username || "U")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {dbUser.full_name || dbUser.username}
                                  </p>
                                  {getStatusIcon(dbUser.status || "pending")}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {dbUser.email}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {dbUser.student_id && (
                                    <span>ID: {dbUser.student_id}</span>
                                  )}
                                  {dbUser.department && (
                                    <span>• {dbUser.department}</span>
                                  )}
                                  {dbUser.year && <span>• {dbUser.year}</span>}
                                  <span>
                                    • Joined{" "}
                                    {new Date(
                                      dbUser.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Status Badge */}
                              <Badge
                                variant="outline"
                                className={getStatusColor(
                                  dbUser.status || "pending"
                                )}
                              >
                                {(dbUser.status || "pending")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (dbUser.status || "pending").slice(1)}
                              </Badge>

                              {/* Role Badge */}
                              <Badge variant="secondary">
                                {(dbUser.role || "student")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (dbUser.role || "student").slice(1)}
                              </Badge>

                              {/* Actions */}
                              <div className="flex items-center space-x-1">
                                {/* Approve Button */}
                                {(dbUser.status || "pending") === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleApproveUser(
                                        dbUser.id,
                                        dbUser.full_name || dbUser.username
                                      )
                                    }
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Suspend/Reactivate Button */}
                                {(dbUser.status || "pending") === "approved" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleSuspendUser(
                                        dbUser.id,
                                        dbUser.full_name || dbUser.username
                                      )
                                    }
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                ) : (dbUser.status || "pending") ===
                                  "suspended" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleApproveUser(
                                        dbUser.id,
                                        dbUser.full_name || dbUser.username
                                      )
                                    }
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                ) : null}

                                {/* Role Update */}
                                <Select
                                  value={dbUser.role || "student"}
                                  onValueChange={(newRole: any) =>
                                    handleUpdateRole(
                                      dbUser.id,
                                      newRole,
                                      dbUser.full_name || dbUser.username
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="student">
                                      Student
                                    </SelectItem>
                                    <SelectItem value="faculty">
                                      Faculty
                                    </SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>

                                {/* Delete Button */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to permanently
                                        delete{" "}
                                        {dbUser.full_name || dbUser.username}?
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() =>
                                          handleDeleteUser(
                                            dbUser.id,
                                            dbUser.full_name || dbUser.username
                                          )
                                        }
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? "No users found matching your search."
                            : "No users found."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Clubs Section */}
            {activeTab === "clubs" && (
              <div className="space-y-6">
                {/* Club Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Clubs
                          </p>
                          <p className="text-2xl font-bold">{clubs.length}</p>
                        </div>
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Active Clubs
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {clubs.filter((c) => c.status === "active").length}
                          </p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Categories
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {
                              new Set(
                                clubs.map((c) => c.category).filter(Boolean)
                              ).size
                            }
                          </p>
                        </div>
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Add/Edit Club Form */}
                {(showAddClubForm || editingClub) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {editingClub ? "Edit Club" : "Add New Club"}
                      </CardTitle>
                      <CardDescription>
                        {editingClub
                          ? "Update club information"
                          : "Create a new student club"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Club Name *</Label>
                          <Input
                            id="name"
                            value={clubFormData.name}
                            onChange={(e) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter club name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={clubFormData.category}
                            onValueChange={(value) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {clubCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <textarea
                            id="description"
                            value={clubFormData.description}
                            onChange={(e) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Enter club description"
                            className="w-full border rounded p-3 h-24"
                          />
                        </div>
                        <div>
                          <Label htmlFor="meeting_time">Meeting Time</Label>
                          <Input
                            id="meeting_time"
                            value={clubFormData.meeting_time}
                            onChange={(e) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                meeting_time: e.target.value,
                              }))
                            }
                            placeholder="e.g., Every Monday 3 PM"
                          />
                        </div>
                        <div>
                          <Label htmlFor="meeting_location">
                            Meeting Location
                          </Label>
                          <Input
                            id="meeting_location"
                            value={clubFormData.meeting_location}
                            onChange={(e) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                meeting_location: e.target.value,
                              }))
                            }
                            placeholder="e.g., Room 101"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_members">Max Members</Label>
                          <Input
                            id="max_members"
                            type="number"
                            value={clubFormData.max_members}
                            onChange={(e) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                max_members: e.target.value,
                              }))
                            }
                            placeholder="50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="requirements">Requirements</Label>
                          <Input
                            id="requirements"
                            value={clubFormData.requirements}
                            onChange={(e) =>
                              setClubFormData((prev) => ({
                                ...prev,
                                requirements: e.target.value,
                              }))
                            }
                            placeholder="e.g., GPA 3.0+"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={handleCancelClub}>
                          Cancel
                        </Button>
                        <Button
                          onClick={
                            editingClub ? handleUpdateClub : handleAddClub
                          }
                          disabled={!clubFormData.name.trim()}
                        >
                          {editingClub ? "Update Club" : "Create Club"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Clubs Management */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Club Management</CardTitle>
                        <CardDescription>
                          Manage all registered clubs, view details, and update
                          information
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowRemoveAllAdminsModal(true)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          title="Remove all club admin assignments"
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Remove All Admins
                        </Button>
                        <Button onClick={() => setShowAddClubForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Club
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clubsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">
                          Loading clubs...
                        </p>
                      </div>
                    ) : clubsError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600">Error: {clubsError}</p>
                      </div>
                    ) : clubs.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                          No clubs found
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          No clubs are currently registered in the system.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Category
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Description
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Club Admin
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Meeting Time
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Max Members
                              </th>
                              <th className="text-right py-3 px-4 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {clubs.map((club) => (
                              <tr
                                key={club.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {club.name}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline">
                                    {club.category || "N/A"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div
                                    className="max-w-xs truncate"
                                    title={club.description}
                                  >
                                    {club.description || "No description"}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        {club.admin_name || "Unassigned"}
                                      </span>
                                      {club.admin_source === "club_admin" && (
                                        <Badge
                                          variant="default"
                                          className="text-xs"
                                        >
                                          Assigned
                                        </Badge>
                                      )}
                                      {club.admin_source === "created_by" && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Creator
                                        </Badge>
                                      )}
                                    </div>
                                    {club.admin_email && (
                                      <span className="text-xs text-muted-foreground">
                                        {club.admin_email}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {club.meeting_time || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  {club.max_members || "Unlimited"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleAssignClubAdmin(club)
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <UserCog className="h-4 w-4 mr-1" />
                                      Assign Admin
                                    </Button>
                                    {/* Remove Admin Button - Always visible for clubs with admins */}
                                    {(club.admin_source === "club_admin" ||
                                      club.admin_source === "created_by") && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          removeClubAdmin(club.id, club.name)
                                        }
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        disabled={assigningAdmin}
                                        title="Remove current admin from this club"
                                      >
                                        <UserCog className="h-4 w-4 mr-1" />
                                        Remove Admin
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditClub(club)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Club
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete{" "}
                                            {club.name}? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteClub(
                                                club.id,
                                                club.name
                                              )
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Events Section */}
            {activeTab === "events" && (
              <div className="space-y-6">
                {/* Event Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Events
                          </p>
                          <p className="text-2xl font-bold">{events.length}</p>
                        </div>
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Upcoming Events
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {
                              events.filter(
                                (e) => new Date(e.start_at) > new Date()
                              ).length
                            }
                          </p>
                        </div>
                        <Clock className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Event Types
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {
                              new Set(
                                events.map((e) => e.event_type).filter(Boolean)
                              ).size
                            }
                          </p>
                        </div>
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            This Month
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {
                              events.filter((e) => {
                                const eventDate = new Date(e.start_at);
                                const now = new Date();
                                return (
                                  eventDate.getMonth() === now.getMonth() &&
                                  eventDate.getFullYear() === now.getFullYear()
                                );
                              }).length
                            }
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Add/Edit Event Form */}
                {(showAddEventForm || editingEvent) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {editingEvent ? "Edit Event" : "Add New Event"}
                      </CardTitle>
                      <CardDescription>
                        {editingEvent
                          ? "Update event information"
                          : "Create a new event"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Event Title *</Label>
                          <Input
                            id="title"
                            value={eventFormData.title}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Enter event title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="event_type">Event Type</Label>
                          <Select
                            value={eventFormData.event_type}
                            onValueChange={(value) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                event_type: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                              {eventTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="start_at">Start Date & Time *</Label>
                          <Input
                            id="start_at"
                            type="datetime-local"
                            value={eventFormData.start_at}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                start_at: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_at">End Date & Time</Label>
                          <Input
                            id="end_at"
                            type="datetime-local"
                            value={eventFormData.end_at}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                end_at: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={eventFormData.location}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            placeholder="Enter event location"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_participants">
                            Max Participants
                          </Label>
                          <Input
                            id="max_participants"
                            type="number"
                            value={eventFormData.max_participants}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                max_participants: e.target.value,
                              }))
                            }
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizer">Organizer</Label>
                          <Input
                            id="organizer"
                            value={eventFormData.organizer}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                organizer: e.target.value,
                              }))
                            }
                            placeholder="Enter organizer name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_email">Contact Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={eventFormData.contact_email}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                contact_email: e.target.value,
                              }))
                            }
                            placeholder="organizer@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="registration_deadline">
                            Registration Deadline
                          </Label>
                          <Input
                            id="registration_deadline"
                            type="date"
                            value={eventFormData.registration_deadline}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                registration_deadline: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <textarea
                            id="description"
                            value={eventFormData.description}
                            onChange={(e) =>
                              setEventFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Enter event description"
                            className="w-full border rounded p-3 h-24"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={handleCancelEvent}>
                          Cancel
                        </Button>
                        <Button
                          onClick={
                            editingEvent ? handleUpdateEvent : handleAddEvent
                          }
                          disabled={
                            !eventFormData.title.trim() ||
                            !eventFormData.start_at
                          }
                        >
                          {editingEvent ? "Update Event" : "Create Event"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Events Management */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Event Management</CardTitle>
                        <CardDescription>
                          Manage all events, view details, and update
                          information
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowAddEventForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Event
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {eventsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">
                          Loading events...
                        </p>
                      </div>
                    ) : eventsError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600">Error: {eventsError}</p>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                          No events found
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          No events are currently scheduled in the system.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">
                                Title
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Type
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Start Date & Time
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Location
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Organizer
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                Max Participants
                              </th>
                              <th className="text-right py-3 px-4 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {events.map((event) => (
                              <tr
                                key={event.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  <div className="max-w-xs">
                                    <div className="font-medium">
                                      {event.title}
                                    </div>
                                    <div
                                      className="text-sm text-muted-foreground truncate"
                                      title={event.description}
                                    >
                                      {event.description || "No description"}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline">
                                    {event.event_type || "N/A"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {new Date(
                                        event.start_at
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {new Date(
                                        event.start_at
                                      ).toLocaleTimeString()}
                                    </div>
                                    {event.end_at &&
                                      event.end_at !== event.start_at && (
                                        <div className="text-muted-foreground text-xs">
                                          to{" "}
                                          {new Date(
                                            event.end_at
                                          ).toLocaleDateString()}{" "}
                                          {new Date(
                                            event.end_at
                                          ).toLocaleTimeString()}
                                        </div>
                                      )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {event.location || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  {event.organizer || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  {event.max_participants || "Unlimited"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditEvent(event)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Event
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete{" "}
                                            {event.title}? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteEvent(
                                                event.id,
                                                event.title
                                              )
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics Section */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Users
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {users.length}
                          </p>
                          <p className="text-xs text-success">
                            {
                              users.filter((u) => u.user_status === "active")
                                .length
                            }{" "}
                            Active
                          </p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Active Clubs
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {clubs.length}
                          </p>
                          <p className="text-xs text-success">
                            {
                              clubs.filter(
                                (c) =>
                                  c.admin_source === "club_admin" ||
                                  c.admin_source === "created_by"
                              ).length
                            }{" "}
                            Managed
                          </p>
                        </div>
                        <div className="bg-accent/10 p-3 rounded-lg">
                          <Shield className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Events
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {events.length}
                          </p>
                          <p className="text-xs text-success">
                            {
                              events.filter(
                                (e) => new Date(e.start_at) > new Date()
                              ).length
                            }{" "}
                            Upcoming
                          </p>
                        </div>
                        <div className="bg-warning/10 p-3 rounded-lg">
                          <Calendar className="h-6 w-6 text-warning" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Event Registrations
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            456
                          </p>
                          <p className="text-xs text-success">
                            +15% from last week
                          </p>
                        </div>
                        <div className="bg-success/10 p-3 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-success" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Growth Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Growth Trend</CardTitle>
                      <CardDescription>
                        Monthly user registration growth
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            Chart visualization coming soon...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Club Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Club Activity Overview</CardTitle>
                      <CardDescription>
                        Most active clubs this month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          {
                            name: "Robotics Club",
                            members: 45,
                            events: 8,
                            growth: "+12%",
                          },
                          {
                            name: "Drama Society",
                            members: 32,
                            events: 6,
                            growth: "+8%",
                          },
                          {
                            name: "Chess Club",
                            members: 28,
                            events: 4,
                            growth: "+15%",
                          },
                          {
                            name: "Photography Club",
                            members: 25,
                            events: 5,
                            growth: "+20%",
                          },
                        ].map((club, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{club.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {club.members} members • {club.events} events
                              </p>
                            </div>
                            <Badge variant="default" className="text-xs">
                              {club.growth}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Department Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Department-wise Statistics</CardTitle>
                    <CardDescription>
                      User distribution across departments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          department: "Computer Science",
                          users: users.filter(
                            (u) => u.department === "Computer Science"
                          ).length,
                          percentage:
                            users.length > 0
                              ? `${(
                                  (users.filter(
                                    (u) => u.department === "Computer Science"
                                  ).length /
                                    users.length) *
                                  100
                                ).toFixed(1)}%`
                              : "0%",
                        },
                        {
                          department: "Engineering",
                          users: users.filter(
                            (u) => u.department === "Engineering"
                          ).length,
                          percentage:
                            users.length > 0
                              ? `${(
                                  (users.filter(
                                    (u) => u.department === "Engineering"
                                  ).length /
                                    users.length) *
                                  100
                                ).toFixed(1)}%`
                              : "0%",
                        },
                        {
                          department: "Business",
                          users: users.filter(
                            (u) => u.department === "Business"
                          ).length,
                          percentage:
                            users.length > 0
                              ? `${(
                                  (users.filter(
                                    (u) => u.department === "Business"
                                  ).length /
                                    users.length) *
                                  100
                                ).toFixed(1)}%`
                              : "0%",
                        },
                        {
                          department: "Arts & Humanities",
                          users: users.filter(
                            (u) => u.department === "Arts & Humanities"
                          ).length,
                          percentage:
                            users.length > 0
                              ? `${(
                                  (users.filter(
                                    (u) => u.department === "Arts & Humanities"
                                  ).length /
                                    users.length) *
                                  100
                                ).toFixed(1)}%`
                              : "0%",
                        },
                        {
                          department: "Medicine",
                          users: users.filter(
                            (u) => u.department === "Medicine"
                          ).length,
                          percentage:
                            users.length > 0
                              ? `${(
                                  (users.filter(
                                    (u) => u.department === "Medicine"
                                  ).length /
                                    users.length) *
                                  100
                                ).toFixed(1)}%`
                              : "0%",
                        },
                        {
                          department: "Others",
                          users: users.filter(
                            (u) =>
                              ![
                                "Computer Science",
                                "Engineering",
                                "Business",
                                "Arts & Humanities",
                                "Medicine",
                              ].includes(u.department)
                          ).length,
                          percentage:
                            users.length > 0
                              ? `${(
                                  (users.filter(
                                    (u) =>
                                      ![
                                        "Computer Science",
                                        "Engineering",
                                        "Business",
                                        "Arts & Humanities",
                                        "Medicine",
                                      ].includes(u.department)
                                  ).length /
                                    users.length) *
                                  100
                                ).toFixed(1)}%`
                              : "0%",
                        },
                      ].map((dept, index) => (
                        <div
                          key={index}
                          className="text-center p-4 bg-muted/30 rounded-lg"
                        >
                          <p className="text-2xl font-bold text-foreground">
                            {dept.users}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dept.department}
                          </p>
                          <p className="text-xs text-primary">
                            {dept.percentage}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      System Settings
                    </CardTitle>
                    <CardDescription>
                      Configure platform settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="platform-name">Platform Name</Label>
                          <Input id="platform-name" defaultValue="UniConnect" />
                        </div>
                        <div>
                          <Label htmlFor="university-name">
                            University Name
                          </Label>
                          <Input
                            id="university-name"
                            defaultValue="University of Excellence"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="admin-email">Admin Email</Label>
                          <Input
                            id="admin-email"
                            defaultValue="admin@university.edu"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-clubs">Max Clubs per User</Label>
                          <Input
                            id="max-clubs"
                            type="number"
                            defaultValue="5"
                          />
                        </div>
                      </div>
                    </div>
                    <Button className="w-full md:w-auto">Save Settings</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Club Admin Modal */}
      {showAssignAdminModal && selectedClubForAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Assign Club Admin</h2>
              <Button variant="ghost" size="sm" onClick={closeAssignAdminModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Club: {selectedClubForAdmin.name}
              </h3>
              <p className="text-muted-foreground">
                Select a user to assign as the club administrator. This user
                will have full control over the club.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4">
                {availableUsers.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge variant="secondary">{user.department}</Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          assignAdminToClub(user.id, user.full_name)
                        }
                        disabled={assigningAdmin}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {assigningAdmin ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserCog className="h-4 w-4 mr-2" />
                            Assign as Admin
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {availableUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No available users found for admin assignment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove All Club Admins Modal */}
      {showRemoveAllAdminsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <UserCog className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Remove All Club Admins</h2>
              <p className="text-muted-foreground mb-6">
                This action will remove ALL club admin assignments from the
                system. All clubs will become unassigned and users will lose
                access to Club Dashboard.
              </p>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveAllAdminsModal(false)}
                  disabled={assigningAdmin}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={removeAllClubAdmins}
                  disabled={assigningAdmin}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {assigningAdmin ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Removing...
                    </>
                  ) : (
                    <>
                      <UserCog className="h-4 w-4 mr-2" />
                      Remove All Admins
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
