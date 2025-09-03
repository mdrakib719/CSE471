import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Shield,
} from "lucide-react";
import { useLostFound, LostFoundItem } from "@/hooks/useLostFound";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LostFoundForm from "@/components/LostFoundForm";
import Layout from "@/components/Layout";

const LostFound = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<LostFoundItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LostFoundItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    imageFile: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  const {
    items,
    loading,
    error,
    updateItem,
    updateItemStatus,
    deleteItem,
    getUserItems,
  } = useLostFound();
  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role === "admin";

  const lostItems = items.filter((item) => item.status === "lost");
  const foundItems = items.filter((item) => item.status === "found");
  const claimedItems = items.filter((item) => item.status === "claimed");
  const userItems = getUserItems();

  const filteredLostItems = lostItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFoundItems = foundItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async (
    itemId: string,
    newStatus: "lost" | "found" | "claimed"
  ) => {
    try {
      await updateItemStatus(itemId, newStatus);
      toast({
        title: "Status Updated",
        description: `Item status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast({
        title: "Item Deleted",
        description: "Item has been removed successfully",
      });
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: LostFoundItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description,
      location: item.location,
      imageFile: null,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    try {
      setUploading(true);

      const updates: any = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        location: editForm.location.trim(),
      };

      // If there's an image file, you would upload it here
      // For now, we'll just update the text fields
      if (editForm.imageFile) {
        // TODO: Implement image upload to storage and get URL
        // updates.image_url = uploadedImageUrl;
      }

      await updateItem(editingItem.id, updates);

      toast({
        title: "Item Updated",
        description: "Item has been updated successfully",
      });

      setShowEditDialog(false);
      setEditingItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setEditForm((prev) => ({ ...prev, imageFile: file }));
    }
  };

  const confirmDelete = (item: LostFoundItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      lost: "destructive",
      found: "default",
      claimed: "secondary",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ItemCard = ({ item }: { item: LostFoundItem }) => {
    const isOwner = user?.id === item.user_id;
    const canEdit = isAdmin || isOwner;
    const canDelete = isAdmin || isOwner;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(item.status)}
                <span className="text-sm text-muted-foreground">
                  by {item.user_name || "Unknown User"}
                </span>
                {isAdmin && (
                  <Badge variant="outline" className="text-xs">
                    Admin View
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="h-8 px-2"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, "claimed")}
                  disabled={item.status === "claimed"}
                  className="h-8 px-3"
                >
                  Mark Claimed
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmDelete(item)}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {item.image_url && (
            <div className="mb-4">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-48 object-cover rounded-lg border"
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-3">
            {item.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lost & Found</h1>
              <p className="text-muted-foreground">
                Report lost items or browse found items. Help your fellow
                students find their belongings.
              </p>
            </div>
            {isAdmin && (
              <Badge variant="secondary" className="text-sm">
                <Shield className="h-4 w-4 mr-1" />
                Admin Access
              </Badge>
            )}
          </div>
          {isAdmin && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Admin Privileges:</strong> You can edit and delete any
                lost/found item.
              </p>
            </div>
          )}
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Report Item
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lost Items</p>
                  <p className="text-2xl font-bold">{lostItems.length}</p>
                </div>
                <Badge variant="destructive">Lost</Badge>
              </div>
            </CardContent>
          </Card>
          {/* <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Found Items</p>
                <p className="text-2xl font-bold">{foundItems.length}</p>
              </div>
              <Badge variant="default">Found</Badge>
            </div>
          </CardContent>
        </Card> */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Claimed Items</p>
                  <p className="text-2xl font-bold">{claimedItems.length}</p>
                </div>
                <Badge variant="secondary">Claimed</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Items</p>
                  <p className="text-2xl font-bold">{userItems.length}</p>
                </div>
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lost" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lost">
              Lost Items ({lostItems.length})
            </TabsTrigger>
            {/* <TabsTrigger value="found">
            Found Items ({foundItems.length})
          </TabsTrigger> */}
            <TabsTrigger value="claimed">
              Claimed Items ({claimedItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost" className="space-y-4">
            {filteredLostItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No lost items found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredLostItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="found" className="space-y-4">
            {filteredFoundItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No found items available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredFoundItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claimed" className="space-y-4">
            {claimedItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No claimed items yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {claimedItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Form Dialog */}
        {showForm && (
          <LostFoundForm
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              toast({
                title: "Item Reported",
                description: "Your item has been reported successfully.",
              });
            }}
          />
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Update the item details. Only admins and item owners can edit
                items.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Item title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Item description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Location where item was lost/found"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-image">Upload Image (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    {editForm.imageFile
                      ? editForm.imageFile.name
                      : "No file selected"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB.
                  <span className="text-amber-600">
                    {" "}
                    Image upload feature coming soon.
                  </span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={
                  uploading ||
                  !editForm.title.trim() ||
                  !editForm.description.trim() ||
                  !editForm.location.trim()
                }
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Item"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{itemToDelete?.title}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => itemToDelete && handleDelete(itemToDelete.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LostFound;
