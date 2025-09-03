import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useClubManagement, type Club, type CreateClubData } from "@/hooks/useClubManagement";

const ClubManagement = () => {
  const { toast } = useToast();
  const { 
    clubs, 
    loading, 
    error, 
    createClub, 
    updateClub, 
    deleteClub, 
    approveClub,
    updateClubStatus 
  } = useClubManagement();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    location: "",
    address: "",
    meeting_day: "",
    meeting_time: "",
    max_members: "",
    requirements: "",
    contact_email: "",
    club_mail: "",
    contact_phone: "",
    club_details: "",
    panel_members: [],
    previous_events: [],
    achievements: [],
    departments: [],
    website: "",
    social_media: {},
    founded_date: "",
    mission_statement: "",
    vision_statement: "",
    is_public: true
  });

  const categories = [
    "Academic", "Creative", "Sports", "Technology", "Community", 
    "Cultural", "Professional", "Environmental", "Health", "Other"
  ];

  const meetingDays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      location: "",
      address: "",
      meeting_day: "",
      meeting_time: "",
      max_members: "",
      requirements: "",
      contact_email: "",
      club_mail: "",
      contact_phone: "",
      club_details: "",
      panel_members: [],
      previous_events: [],
      achievements: [],
      departments: [],
      website: "",
      social_media: {},
      founded_date: "",
      mission_statement: "",
      vision_statement: "",
      is_public: true
    });
    setEditingClub(null);
  };

  const handleCreateClub = async () => {
    const clubData: CreateClubData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      location: formData.location || undefined,
      address: formData.address || undefined,
      meeting_day: formData.meeting_day || undefined,
      meeting_time: formData.meeting_time || undefined,
      max_members: formData.max_members ? parseInt(formData.max_members) : undefined,
      requirements: formData.requirements || undefined,
      contact_email: formData.contact_email || undefined,
      club_mail: formData.club_mail || undefined,
      contact_phone: formData.contact_phone || undefined,
      club_details: formData.club_details || undefined,
      panel_members: formData.panel_members || undefined,
      previous_events: formData.previous_events || undefined,
      achievements: formData.achievements || undefined,
      departments: formData.departments || undefined,
      website: formData.website || undefined,
      social_media: formData.social_media || undefined,
      founded_date: formData.founded_date || undefined,
      mission_statement: formData.mission_statement || undefined,
      vision_statement: formData.vision_statement || undefined,
      is_public: formData.is_public,
    };

    const clubId = await createClub(clubData);
    
    if (clubId) {
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Club Created",
        description: "The club has been created successfully and is pending approval.",
      });
    }
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description,
      category: club.category,
      location: club.location || "",
      address: club.address || "",
      meeting_day: club.meeting_day || "",
      meeting_time: club.meeting_time || "",
      max_members: club.max_members?.toString() || "",
      requirements: club.requirements || "",
      contact_email: club.contact_email || "",
      club_mail: club.club_mail || "",
      contact_phone: club.contact_phone || "",
      club_details: club.club_details || "",
      panel_members: club.panel_members || [],
      previous_events: club.previous_events || [],
      achievements: club.achievements || [],
      departments: club.departments || [],
      website: club.website || "",
      social_media: club.social_media || {},
      founded_date: club.founded_date || "",
      mission_statement: club.mission_statement || "",
      vision_statement: club.vision_statement || "",
      is_public: club.is_public ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateClub = async () => {
    if (!editingClub) return;

    const clubData: CreateClubData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      location: formData.location || undefined,
      address: formData.address || undefined,
      meeting_day: formData.meeting_day || undefined,
      meeting_time: formData.meeting_time || undefined,
      max_members: formData.max_members ? parseInt(formData.max_members) : undefined,
      requirements: formData.requirements || undefined,
      contact_email: formData.contact_email || undefined,
      club_mail: formData.club_mail || undefined,
      contact_phone: formData.contact_phone || undefined,
      club_details: formData.club_details || undefined,
      panel_members: formData.panel_members || undefined,
      previous_events: formData.previous_events || undefined,
      achievements: formData.achievements || undefined,
      departments: formData.departments || undefined,
      website: formData.website || undefined,
      social_media: formData.social_media || undefined,
      founded_date: formData.founded_date || undefined,
      mission_statement: formData.mission_statement || undefined,
      vision_statement: formData.vision_statement || undefined,
      is_public: formData.is_public,
    };

    const success = await updateClub(editingClub.id, clubData);
    
    if (success) {
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Club Updated",
        description: "The club has been updated successfully.",
      });
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    const success = await deleteClub(clubId);
    
    if (success) {
      toast({
        title: "Club Deleted",
        description: "The club has been deleted successfully.",
      });
    }
  };

  const handleApproveClub = async (clubId: string) => {
    const success = await approveClub(clubId);
    
    if (success) {
      toast({
        title: "Club Approved",
        description: "The club has been approved and is now active.",
      });
    }
  };

  const handleStatusChange = async (clubId: string, status: 'pending' | 'active' | 'inactive' | 'suspended') => {
    const success = await updateClubStatus(clubId, status);
    
    if (success) {
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      toast({
        title: "Status Updated",
        description: `The club status has been changed to ${statusText}.`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'inactive': return 'outline';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'inactive': return <Pause className="h-4 w-4" />;
      case 'suspended': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && clubs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Club Management
              </CardTitle>
              <CardDescription>Approve and manage student clubs</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-gradient-hero">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Club
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingClub ? "Edit Club" : "Add New Club"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClub ? "Update the club details" : "Fill in the details to create a new club"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Club Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter club name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the club's purpose and activities"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_members">Maximum Members</Label>
                      <Input
                        id="max_members"
                        name="max_members"
                        type="number"
                        value={formData.max_members}
                        onChange={handleInputChange}
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="requirements">Requirements</Label>
                      <Textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        placeholder="Any prerequisites or requirements for joining"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Location & Schedule */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location">Meeting Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Room 201, Main Building"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Club Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="e.g., 123 University Ave, City, Country"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meeting_day">Meeting Day</Label>
                      <Select value={formData.meeting_day} onValueChange={(value) => handleSelectChange("meeting_day", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meeting day" />
                        </SelectTrigger>
                        <SelectContent>
                          {meetingDays.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="meeting_time">Meeting Time</Label>
                      <Input
                        id="meeting_time"
                        name="meeting_time"
                        value={formData.meeting_time}
                        onChange={handleInputChange}
                        placeholder="e.g., 3:00 PM - 5:00 PM"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder="club@university.edu"
                      />
                    </div>

                    <div>
                      <Label htmlFor="club_mail">Club Mail</Label>
                      <Input
                        id="club_mail"
                        name="club_mail"
                        type="email"
                        value={formData.club_mail}
                        onChange={handleInputChange}
                        placeholder="club.official@university.edu"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        placeholder="+880 1234-567890"
                      />
                    </div>
                  </div>

                  {/* Additional Club Information */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <Label htmlFor="club_details">Club Details (Extended Description)</Label>
                      <Textarea
                        id="club_details"
                        name="club_details"
                        value={formData.club_details}
                        onChange={handleInputChange}
                        placeholder="Provide detailed information about the club's activities, goals, and structure..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="mission_statement">Mission Statement</Label>
                      <Textarea
                        id="mission_statement"
                        name="mission_statement"
                        value={formData.mission_statement}
                        onChange={handleInputChange}
                        placeholder="What is the club's mission and purpose?"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="vision_statement">Vision Statement</Label>
                      <Textarea
                        id="vision_statement"
                        name="vision_statement"
                        value={formData.vision_statement}
                        onChange={handleInputChange}
                        placeholder="What is the club's vision for the future?"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Club Website</Label>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://club-website.com"
                          type="url"
                        />
                      </div>

                      <div>
                        <Label htmlFor="founded_date">Founded Date</Label>
                        <Input
                          id="founded_date"
                          name="founded_date"
                          value={formData.founded_date}
                          onChange={handleInputChange}
                          placeholder="YYYY-MM-DD"
                          type="date"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="departments">Club Departments/Teams</Label>
                      <Textarea
                        id="departments"
                        name="departments"
                        value={formData.departments}
                        onChange={handleInputChange}
                        placeholder="List the main departments or teams within the club (e.g., Events Team, Marketing Team, Technical Team)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="panel_members">Executive Panel Members</Label>
                      <Textarea
                        id="panel_members"
                        name="panel_members"
                        value={formData.panel_members}
                        onChange={handleInputChange}
                        placeholder="List key panel members (e.g., President: John Doe, Vice President: Jane Smith, Secretary: Bob Johnson)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="achievements">Club Achievements</Label>
                      <Textarea
                        id="achievements"
                        name="achievements"
                        value={formData.achievements}
                        onChange={handleInputChange}
                        placeholder="List notable achievements, awards, or recognitions the club has received"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="previous_events">Previous Events</Label>
                      <Textarea
                        id="previous_events"
                        name="previous_events"
                        value={formData.previous_events}
                        onChange={handleInputChange}
                        placeholder="List major events or activities the club has organized in the past"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="social_media">Social Media Links</Label>
                      <Textarea
                        id="social_media"
                        name="social_media"
                        value={formData.social_media}
                        onChange={handleInputChange}
                        placeholder="Facebook: https://facebook.com/club, Instagram: https://instagram.com/club, Twitter: https://twitter.com/club"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingClub ? handleUpdateClub : handleCreateClub}>
                    {editingClub ? "Update Club" : "Create Club"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Clubs List */}
      <Card>
        <CardHeader>
          <CardTitle>All Clubs ({clubs.length})</CardTitle>
          <CardDescription>Manage all student clubs from here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clubs.map((club) => (
              <div key={club.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">{club.name}</h4>
                      <Badge variant={getStatusColor(club.status)} className="flex items-center space-x-1">
                        {getStatusIcon(club.status)}
                        <span>{club.status.charAt(0).toUpperCase() + club.status.slice(1)}</span>
                      </Badge>
                      <Badge variant="outline">{club.category}</Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">{club.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {club.members_count || 0} members
                        {club.max_members && ` / ${club.max_members}`}
                      </div>
                      {club.location && (
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {club.location}
                        </div>
                      )}
                      {club.meeting_day && club.meeting_time && (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {club.meeting_day} at {club.meeting_time}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {club.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveClub(club.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {club.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(club.id, 'inactive')}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}

                    {club.status === 'inactive' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(club.id, 'active')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}

                    {(club.status === 'active' || club.status === 'inactive') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(club.id, 'suspended')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClub(club)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClub(club.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {clubs.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No clubs found. Create your first club!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubManagement;
