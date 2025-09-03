import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  Edit,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Users,
  Award,
  Upload,
  X,
  Trash2,
  Loader,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useUserEvents } from "@/hooks/useUserEvents";
import { useUserEventsById } from "@/hooks/useUserEventsById";
import { useUserClubApplications } from "@/hooks/useUserClubApplications";
import { useUserClubMemberships } from "@/hooks/useUserClubMemberships";
import { supabase } from "@/lib/supabase";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/lib/cloudinary";
import UniversityCalendar from "@/components/UniversityCalendar";

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  // Determine if this is viewing own profile or another user's profile
  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;
  
  const { events: userEvents, loading: eventsLoading } = useUserEvents();
  const { events: targetUserEvents, loading: targetEventsLoading } = useUserEventsById(isOwnProfile ? undefined : targetUserId);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { applications: clubApplications, loading: applicationsLoading } =
    useUserClubApplications();
  const { memberships: clubMemberships, loading: membershipsLoading } =
    useUserClubMemberships(isOwnProfile ? undefined : targetUserId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Initialize form data from user data
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    year: "",
    gpa: "",
    student_id: "",
    employee_id: "",
    date_of_birth: "",
    bio: "",
    interests: "",
    achievements: "",
    courses_taught: "", // For faculty
  });

  // Fetch user data from users table
  const fetchUserData = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      console.log("Fetching user data for ID:", targetUserId);

      // Try to fetch from users table first
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

      // If that fails, try manual_users table as fallback
      if (error) {
        console.log("Error with users table:", error);
        if (error.code === "PGRST116" || error.code === "PGRST204") {
          console.log("Trying manual_users table as fallback...");
          const fallbackResult = await supabase
            .from("manual_users")
            .select("*")
            .eq("id", targetUserId)
            .single();

          data = fallbackResult.data;
          error = fallbackResult.error;
        }
      }

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        return;
      }

      setUserData(data);
      
      // Only set form data for own profile (for editing)
      if (isOwnProfile) {
        setFormData({
          full_name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          department: data.department || "",
          year: data.year || "",
          gpa: data.gpa || "",
          student_id: data.student_id || "",
          employee_id: data.employee_id || "",
          date_of_birth: data.date_of_birth || "",
          bio: data.bio || "",
          interests: data.interests || "",
          achievements: data.achievements || "",
          courses_taught: data.courses_taught || "",
        });
      }
      setProfileImage(data.avatar_url || null);
    } catch (err) {
      console.error("Error in fetchUserData:", err);
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  // Update user data in users table
  const updateUserData = async (data: any) => {
    if (!user?.id || !isOwnProfile) return false;

    try {
      // Sanitize payload: remove empty-string fields and coerce dates
      const sanitizedData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value === "") {
          // Skip empty strings to avoid type errors (e.g., date fields)
          return;
        }
        // Pass through other values
        sanitizedData[key] = value;
      });

      // Try to update users table first
      let { error } = await supabase
        .from("users")
        .update(sanitizedData)
        .eq("id", user.id);

      // If that fails, try manual_users table as fallback
      if (error) {
        console.log("Error updating users table:", error);
        if (error.code === "PGRST116" || error.code === "PGRST204") {
          console.log("Trying to update manual_users table as fallback...");
          const fallbackResult = await supabase
            .from("manual_users")
            .update(sanitizedData)
            .eq("id", user.id);

          error = fallbackResult.error;
        }
      }

      if (error) {
        setError(error.message);
        return false;
      }

      await fetchUserData(); // Refresh data
      return true;
    } catch (err) {
      setError("Failed to update user data");
      return false;
    }
  };

  // Upload profile image to Cloudinary
  const uploadProfileImage = async (file: File) => {
    if (!user?.id) return null;

    try {
      setUploading(true);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'profile-images');
      
      if (!imageUrl) {
        throw new Error('Upload failed');
      }

      return imageUrl;
    } catch (err) {
      console.error('Upload error:', err);
      setError("Failed to upload image to Cloudinary");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Delete profile image from Cloudinary
  const deleteProfileImage = async () => {
    if (!user?.id || !profileImage) return false;

    try {
      // For Cloudinary, we can't delete from client-side due to security
      // The image will remain in Cloudinary but won't be referenced
      // In a production app, you'd want to implement server-side deletion
      console.log('Image deletion from Cloudinary requires server-side implementation');
      
      // For now, we'll just return true since we can't delete from client
      return true;
    } catch (err) {
      setError("Failed to delete image");
      return false;
    }
  };

  // Helper function to check if user is admin
  const isAdmin = user?.role === "admin";
  
  // Helper function to check if user is faculty
  const isFaculty = user?.role === "faculty";
  
  // Helper function to check if user is student
  const isStudent = user?.role === "student";

  // Helper functions for target user's role (for viewing other profiles)
  const targetIsAdmin = userData?.role === "admin";
  const targetIsFaculty = userData?.role === "faculty";
  const targetIsStudent = userData?.role === "student";

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [targetUserId]);

  // Fetch notifications when userData changes
  useEffect(() => {
    if (userData) {
      fetchNotifications();
    }
  }, [userData]);

  // Handle clicking outside notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications from user data
  const fetchNotifications = async () => {
    if (!userData?.notifications) return;

    try {
      let notificationData = userData.notifications;

      // Handle corrupted JSON data
      if (typeof notificationData === "string") {
        try {
          notificationData = JSON.parse(notificationData);
        } catch (parseError) {
          console.error("Error parsing notifications:", parseError);
          // Try to clean corrupted data
          notificationData = [];
        }
      }

      // Ensure it's an array and filter out invalid notifications
      if (Array.isArray(notificationData)) {
        // Filter out invalid notifications - only keep properly formatted ones
        const validNotifications = notificationData.filter(
          (notification: any) => {
            // Check if notification has all required fields and valid structure
            return (
              notification &&
              typeof notification === "object" &&
              notification.id &&
              notification.title &&
              notification.message &&
              notification.type &&
              notification.timestamp &&
              typeof notification.read === "boolean" &&
              // Validate timestamp format
              !isNaN(new Date(notification.timestamp).getTime()) &&
              // Validate type is one of the expected values
              ["info", "success", "warning", "error"].includes(
                notification.type
              )
            );
          }
        );

        console.log("Valid notifications found:", validNotifications.length);
        console.log(
          "Invalid notifications filtered out:",
          notificationData.length - validNotifications.length
        );

        // If we found corrupted data, clean it up in the database
        if (validNotifications.length < notificationData.length) {
          console.log("Cleaning up corrupted notifications in database...");
          // Update the database with only valid notifications
          updateUserData({ notifications: validNotifications }).catch((err) => {
            console.error("Error cleaning up notifications:", err);
          });
        }

        setNotifications(validNotifications);
        const unread = validNotifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error processing notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const updatedNotifications = notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );

      const success = await updateUserData({
        notifications: updatedNotifications,
      });
      if (success) {
        setNotifications(updatedNotifications);
        const unread = updatedNotifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const updatedNotifications = notifications.map((n: any) => ({
        ...n,
        read: true,
      }));

      const success = await updateUserData({
        notifications: updatedNotifications,
      });
      if (success) {
        setNotifications(updatedNotifications);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Clean up corrupted notifications manually
  const cleanupCorruptedNotifications = async () => {
    if (!user?.id) return;

    try {
      console.log("Manual cleanup of corrupted notifications...");
      // Set to empty array to clear all corrupted data
      const success = await updateUserData({ notifications: [] });
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
        toast({
          title: "Notifications Cleaned",
          description: "Corrupted notifications have been removed.",
        });
      }
    } catch (err) {
      console.error("Error cleaning up notifications:", err);
      toast({
        title: "Error",
        description: "Failed to clean up notifications.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateUserData(formData);
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error(error || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit for Cloudinary)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageUrl = await uploadProfileImage(file);
      if (imageUrl) {
        // Update the database with the new avatar URL
        const success = await updateUserData({ avatar_url: imageUrl });
        if (success) {
          setProfileImage(imageUrl);
           // Refresh the global user context to update the header avatar
           await refreshUser();
           // Dispatch custom event to refresh header avatar
           window.dispatchEvent(new CustomEvent('avatar-refreshed'));
          toast({
            title: "Success!",
             description: "Profile picture uploaded to Cloudinary successfully!",
          });
        } else {
          throw new Error("Failed to save avatar to database");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image to Cloudinary.",
        variant: "destructive",
      });
    }
    
    // Clear the file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    try {
      const success = await deleteProfileImage();
      if (success) {
        // Update the database to remove avatar URL
        await updateUserData({ avatar_url: "" });
        setProfileImage(null);
         // Refresh the global user context to update the header avatar
         await refreshUser();
         // Dispatch custom event to refresh header avatar
         window.dispatchEvent(new CustomEvent('avatar-refreshed'));
        toast({
          title: "Success!",
          description: "Profile picture removed successfully.",
        });
      } else {
        throw new Error("Failed to remove profile picture");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove profile picture.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "withdrawn":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "withdrawn":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8 bg-gradient-card border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage
                      src={profileImage ? getOptimizedImageUrl(profileImage, 256, 256) : undefined}
                      alt={formData.full_name}
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                      {formData.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Image Upload Controls - Only for own profile */}
                  {isOwnProfile && (
                    <div className="absolute bottom-0 right-0 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>

                      {profileImage && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full shadow-md"
                          onClick={handleDeleteImage}
                          disabled={uploading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />


                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        {isOwnProfile ? formData.full_name : userData?.full_name}
                      </h1>
                      <p className="text-muted-foreground mb-2">
                        {isOwnProfile ? (
                          isStudent 
                            ? `${formData.department} • ${formData.year}`
                            : isFaculty 
                              ? `${formData.department} • Faculty`
                              : 'Administrator'
                        ) : (
                          targetIsStudent
                            ? `${userData?.department} • ${userData?.year}`
                            : targetIsFaculty
                              ? `${userData?.department} • Faculty`
                              : 'Administrator'
                        )}
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        {(isOwnProfile ? isStudent : targetIsStudent) && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            GPA: {isOwnProfile ? formData.gpa : userData?.gpa}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="bg-success/10 text-success"
                        >
                          {isOwnProfile ? (
                            user?.role
                              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                              : "Student"
                          ) : (
                            userData?.role
                              ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                              : "Student"
                          )}
                        </Badge>
                        {!(isOwnProfile ? isStudent : targetIsStudent) && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {isOwnProfile ? (
                              isAdmin ? 'Employee ID' : 'Faculty ID'
                            ) : (
                              targetIsAdmin ? 'Employee ID' : 'Faculty ID'
                            )}: {isOwnProfile ? (user?.employee_id || 'N/A') : (userData?.employee_id || 'N/A')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Notification Bell - only for own profile */}
                      {isOwnProfile && (
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setShowNotifications(!showNotifications)
                            }
                            className="relative"
                          >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            )}
                          </Button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                          <div
                            ref={notificationsRef}
                            className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                          >
                            <div className="p-3 border-b bg-gray-50">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                <div className="flex items-center gap-2">
                                  {unreadCount > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={markAllAsRead}
                                      className="text-xs"
                                    >
                                      Mark all as read
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cleanupCorruptedNotifications}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Clean Corrupted
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              {notifications.length > 0 ? (
                                notifications.map((notification: any) => (
                                  <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                                      notification.read
                                        ? "bg-gray-50 hover:bg-gray-100"
                                        : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                                    }`}
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm mb-1">
                                          {notification.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 mb-2">
                                          {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                              notification.type === "info"
                                                ? "bg-blue-100 text-blue-800"
                                                : notification.type ===
                                                  "success"
                                                ? "bg-green-100 text-green-800"
                                                : notification.type ===
                                                  "warning"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {notification.type}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(
                                              notification.timestamp
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 ml-2"></div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6 text-gray-500">
                                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p>No notifications</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      )}

                      {isOwnProfile && (
                        <Button
                          onClick={() =>
                            isEditing ? handleSave() : setIsEditing(true)
                          }
                          variant={isEditing ? "success" : "outline"}
                          disabled={saving || loading}
                          className="w-full md:w-auto"
                        >
                          {saving ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : isEditing ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          ) : (
                            <>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Profile
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center md:justify-start">
                      <Mail className="mr-2 h-4 w-4" />
                      {isOwnProfile ? formData.email : userData?.email}
                    </div>
                    <div className="flex items-center justify-center md:justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      {isOwnProfile ? formData.phone : userData?.phone}
                    </div>
                    <div className="flex items-center justify-center md:justify-start">
                      <MapPin className="mr-2 h-4 w-4" />
                      {isOwnProfile ? formData.address : userData?.address}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className={`grid w-full ${
              (isOwnProfile ? isStudent : targetIsStudent) ? 'grid-cols-5' : 
              isOwnProfile ? 'grid-cols-4' : 'grid-cols-4'
            }`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academic">
                {(isOwnProfile ? isStudent : targetIsStudent) ? 'Academic' : 'Professional'}
              </TabsTrigger>
              {(isOwnProfile ? isStudent : targetIsStudent) && <TabsTrigger value="activities">Activities</TabsTrigger>}
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              {isOwnProfile && <TabsTrigger value="settings">Settings</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && isOwnProfile ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {(isOwnProfile ? formData.bio : userData?.bio) || "No bio information available."}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing && isOwnProfile ? (
                      <Textarea
                        value={formData.interests}
                        onChange={(e) =>
                          handleInputChange("interests", e.target.value)
                        }
                        placeholder="Enter your interests (comma separated)..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(isOwnProfile ? formData.interests : userData?.interests) ? (
                          (isOwnProfile ? formData.interests : userData?.interests)
                            .split(",")
                            .map((interest, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {interest.trim()}
                              </Badge>
                            ))
                        ) : (
                          <p className="text-muted-foreground">
                            No interests added yet.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing && isOwnProfile ? (
                      <Textarea
                        value={formData.achievements}
                        onChange={(e) =>
                          handleInputChange("achievements", e.target.value)
                        }
                        placeholder="Enter your achievements (one per line)..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <ul className="space-y-2">
                        {(isOwnProfile ? formData.achievements : userData?.achievements) ? (
                          (isOwnProfile ? formData.achievements : userData?.achievements)
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((achievement, index) => (
                              <li
                                key={index}
                                className="flex items-center text-sm"
                              >
                                <div className="h-2 w-2 rounded-full bg-primary mr-3" />
                                {achievement.trim()}
                              </li>
                            ))
                        ) : (
                          <li className="text-muted-foreground">
                            No achievements added yet.
                          </li>
                        )}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Academic/Professional Tab */}
            <TabsContent value="academic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {(isOwnProfile ? isStudent : targetIsStudent) ? 'Academic Information' : 'Professional Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(isOwnProfile ? isStudent : targetIsStudent) ? (
                    // Student Academic Information
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="department">Department</Label>
                          {isEditing && isOwnProfile ? (
                            <Select
                              value={formData.department}
                              onValueChange={(value) =>
                                handleInputChange("department", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Computer Science">
                                  Computer Science
                                </SelectItem>
                                <SelectItem value="Electrical Engineering">
                                  Electrical Engineering
                                </SelectItem>
                                <SelectItem value="Business Administration">
                                  Business Administration
                                </SelectItem>
                                <SelectItem value="Economics">Economics</SelectItem>
                                <SelectItem value="Mathematics">
                                  Mathematics
                                </SelectItem>
                                <SelectItem value="Physics">Physics</SelectItem>
                                <SelectItem value="Chemistry">Chemistry</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Architecture">
                                  Architecture
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={isOwnProfile ? formData.department : (userData?.department || "")} readOnly />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="year">Academic Year</Label>
                          {isEditing && isOwnProfile ? (
                            <Select
                              value={formData.year}
                              onValueChange={(value) =>
                                handleInputChange("year", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Freshman">1st Year</SelectItem>
                                <SelectItem value="Sophomore">2nd Year</SelectItem>
                                <SelectItem value="Junior">3rd Year</SelectItem>
                                <SelectItem value="Senior">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={isOwnProfile ? formData.year : (userData?.year || "")} readOnly />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="gpa">Current CGPA</Label>
                          {isEditing && isOwnProfile ? (
                            <Input
                              value={formData.gpa}
                              onChange={(e) =>
                                handleInputChange("gpa", e.target.value)
                              }
                              placeholder="3.50"
                            />
                          ) : (
                            <Input value={isOwnProfile ? formData.gpa : (userData?.gpa || "")} readOnly />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <Label>Student ID</Label>
                          <Input
                            value={isOwnProfile ? (user?.student_id || "Not Available") : (userData?.student_id || "Not Available")}
                            readOnly
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={isOwnProfile ? formData.email : (userData?.email || "")} readOnly />
                        </div>
                      </div>
                    </>
                  ) : (
                    // Admin/Faculty Professional Information
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Employee ID</Label>
                          <Input
                            value={isOwnProfile ? (user?.employee_id || "Not Available") : (userData?.employee_id || "Not Available")}
                            readOnly
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={isOwnProfile ? formData.email : (userData?.email || "")} readOnly />
                        </div>
                      </div>

                      {(isOwnProfile ? isFaculty : targetIsFaculty) && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="department">Department</Label>
                              {isEditing && isOwnProfile ? (
                                <Select
                                  value={formData.department}
                                  onValueChange={(value) =>
                                    handleInputChange("department", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Computer Science">
                                      Computer Science
                                    </SelectItem>
                                    <SelectItem value="Electrical Engineering">
                                      Electrical Engineering
                                    </SelectItem>
                                    <SelectItem value="Business Administration">
                                      Business Administration
                                    </SelectItem>
                                    <SelectItem value="Economics">Economics</SelectItem>
                                    <SelectItem value="Mathematics">
                                      Mathematics
                                    </SelectItem>
                                    <SelectItem value="Physics">Physics</SelectItem>
                                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Architecture">
                                      Architecture
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input value={isOwnProfile ? formData.department : (userData?.department || "")} readOnly />
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="courses_taught">Courses Taught</Label>
                            {isEditing && isOwnProfile ? (
                              <Textarea
                                value={formData.courses_taught}
                                onChange={(e) =>
                                  handleInputChange("courses_taught", e.target.value)
                                }
                                placeholder="Enter courses you teach (one per line)..."
                                className="min-h-[100px]"
                              />
                            ) : (
                              <div className="p-3 border rounded-md bg-muted/50">
                                {(isOwnProfile ? formData.courses_taught : userData?.courses_taught) ? (
                                  <ul className="space-y-1">
                                    {(isOwnProfile ? formData.courses_taught : userData?.courses_taught)
                                      .split("\n")
                                      .filter((line) => line.trim())
                                      .map((course, index) => (
                                        <li
                                          key={index}
                                          className="flex items-center text-sm"
                                        >
                                          <div className="h-2 w-2 rounded-full bg-primary mr-3" />
                                          {course.trim()}
                                        </li>
                                      ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted-foreground">
                                    No courses added yet.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Tab - For Students (both own and other users) */}
            {(isOwnProfile ? isStudent : targetIsStudent) && (
              <TabsContent value="activities" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Recent Joined Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(isOwnProfile ? eventsLoading : targetEventsLoading) ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : (isOwnProfile ? userEvents : targetUserEvents).length > 0 ? (
                      <div className="space-y-4">
                        {(isOwnProfile ? userEvents : targetUserEvents).map((event) => (
                          <div
                            key={event.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">
                                  {event.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {formatDate(event.start_at)}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  event.registration_status === "registered"
                                    ? "default"
                                    : "secondary"
                                }
                                className="ml-2"
                              >
                                {event.registration_status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No events joined yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Join some events to see them here!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Club Applications / Memberships */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      {isOwnProfile ? 'Club Applications' : 'Club Memberships'}
                    </CardTitle>
                    <CardDescription>
                      {isOwnProfile 
                        ? 'Your club membership applications and their status'
                        : 'Clubs this user is a member of'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOwnProfile ? (
                      // Show club applications for own profile
                      applicationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                      ) : clubApplications.length > 0 ? (
                        <div className="space-y-4">
                          {clubApplications.map((application) => (
                            <div
                              key={application.id}
                              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">
                                    {application.club_name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Applied on{" "}
                                    {formatDate(application.application_date)}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {application.motivation}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {getStatusIcon(application.status)}
                                  <Badge
                                    className={getStatusColor(application.status)}
                                    variant="outline"
                                  >
                                    {application.status.charAt(0).toUpperCase() +
                                      application.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>

                              {application.experience && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Experience:</strong>{" "}
                                    {application.experience}
                                  </p>
                                </div>
                              )}

                              {application.skills && (
                                <div className="mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Skills:</strong> {application.skills}
                                  </p>
                                </div>
                              )}

                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Availability:</strong>{" "}
                                  {application.availability}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No club applications yet
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Apply to some clubs to see them here!
                          </p>
                        </div>
                      )
                    ) : (
                      // Show club memberships for other users' profiles
                      membershipsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                      ) : clubMemberships.length > 0 ? (
                        <div className="space-y-4">
                          {clubMemberships.map((membership) => (
                            <div
                              key={membership.id}
                              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">
                                    {membership.club.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Joined on {formatDate(membership.joined_at)}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {membership.club.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  >
                                    {membership.role}
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Category:</strong> {membership.club.category}
                                </p>
                              </div>

                              {membership.detailed_role && (
                                <div className="mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Detailed Role:</strong> {membership.detailed_role}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Not a member of any clubs yet
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            This user hasn't joined any clubs.
                          </p>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </div>
              </TabsContent>
            )}

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <UniversityCalendar />
            </TabsContent>

            {/* Settings Tab - Only for own profile */}
            {isOwnProfile && (
              <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Update your contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
