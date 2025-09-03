import { useState } from "react";
import {
  Search,
  Download,
  Eye,
  BookOpen,
  FileText,
  Video,
  Image,
  Upload,
  Plus,
  Archive,
  Hash,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Layout from "@/components/Layout";
import UploadResourceDialog from "@/components/UploadResourceDialog";
import EditResourceDialog from "@/components/EditResourceDialog";
import ResourcePreviewDialog from "@/components/ResourcePreviewDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useResources } from "@/hooks/useDatabase2";
import { useAuth } from "@/context/AuthContext";
import type { Resource } from "@/lib/supabase";

const categories = [
  "All",
  "Academic",
  "Research",
  "Laboratory",
  "Software",
  "Career",
  "Creative",
  "Reference",
  "Past Papers",
  "Project",
];
const subjects = [
  "All",
  "Computer Science",
  "Programming",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Software Engineering",
  "Computer Networks",
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Economics",
  "Finance",
  "Marketing",
  "Management",
  "English",
  "General Studies",
];
const resourceTypes = [
  "All",
  "PDF",
  "Video",
  "Document",
  "Image",
  "Audio",
  "Archive",
];

const sampleResources: Resource[] = [];

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const {
    resources: dbResources,
    loading: dbLoading,
    error: dbError,
    refetch,
    updateResource,
    deleteResource,
    downloadResource,
    getResourcePreviewUrl,
  } = useResources();

  // Debug logging
  console.log("🔍 DEBUG: dbResources:", dbResources);
  console.log("🔍 DEBUG: dbResources length:", dbResources.length);
  console.log("🔍 DEBUG: sampleResources length:", sampleResources.length);
  console.log("🔍 DEBUG: dbLoading:", dbLoading);
  console.log("🔍 DEBUG: dbError:", dbError);

  // Show detailed info about each DB resource
  dbResources.forEach((resource, index) => {
    console.log(`🔍 DB Resource ${index + 1}:`, {
      id: resource.id,
      title: resource.title,
      file_path: resource.file_path,
      created_at: resource.created_at,
    });
  });

  // Combine database resources with sample resources
  const allResources = [...dbResources, ...sampleResources]; // DB resources first now
  const resources = allResources;
  const loading = dbLoading; // Use actual loading state
  const error = dbError; // Use actual error state

  console.log("🔍 DEBUG: Combined resources length:", resources.length);

  // Apply filters to resources
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      searchTerm === "" ||
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.description &&
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || resource.category === selectedCategory;
    const matchesSubject =
      selectedSubject === "All" || resource.subject === selectedSubject;

    const matchesType =
      selectedType === "All" ||
      (() => {
        const fileType = resource.file_type?.toLowerCase() || "";
        switch (selectedType) {
          case "PDF":
            return fileType.includes("pdf");
          case "Video":
            return fileType.includes("video");
          case "Document":
            return fileType.includes("doc") || fileType.includes("text");
          case "Image":
            return fileType.includes("image");
          case "Audio":
            return fileType.includes("audio");
          case "Archive":
            return fileType.includes("zip") || fileType.includes("rar");
          default:
            return true;
        }
      })();

    return matchesSearch && matchesCategory && matchesSubject && matchesType;
  });

  const getTypeIcon = (fileType?: string) => {
    if (!fileType) return <BookOpen className="h-4 w-4" />;

    // Check if it's a URL (our new link-based system)
    if (fileType.startsWith("http")) {
      return <ExternalLink className="h-4 w-4 text-blue-500" />;
    }

    // Legacy file type handling for existing data
    const type = fileType.toLowerCase();
    if (type.includes("pdf"))
      return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes("video"))
      return <Video className="h-4 w-4 text-purple-500" />;
    if (type.includes("image"))
      return <Image className="h-4 w-4 text-green-500" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className="h-4 w-4 text-orange-500" />;
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getTypeLabel = (fileType?: string) => {
    if (!fileType) return "FILE";

    // Check if it's a URL (our new link-based system)
    if (fileType.startsWith("http")) {
      return "LINK";
    }

    // Legacy file type handling for existing data
    return fileType.split("/")[1]?.toUpperCase() || "FILE";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handlePreview = (resource: Resource) => {
    setPreviewResource(resource);
    setPreviewDialogOpen(true);
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Check if it's a sample resource
      if (resource.file_path.startsWith("sample/")) {
        // Show demo message for sample resources
        alert(
          `Demo Resource: "${resource.title}" would be opened in a real implementation. This is a sample resource for demonstration purposes.`
        );
        return;
      }

      // For real database resources, open the link
      await downloadResource(resource);
    } catch (error) {
      console.error("Failed to open resource:", error);
    }
  };

  // Admin functions
  const isAdmin = user?.role === "admin";

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditDialogOpen(true);
  };

  const handleDelete = async (resource: Resource) => {
    if (
      window.confirm(`Are you sure you want to delete "${resource.title}"?`)
    ) {
      try {
        await deleteResource(resource.id, resource.file_path || "");
        refetch();
      } catch (error) {
        console.error("Failed to delete resource:", error);
        alert("Failed to delete resource. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Error Loading Resources
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Course Resource Repository
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Digital library for non-academic course materials and educational
            resources. Share knowledge and access resources contributed by your
            fellow students.
          </p>
          {isAuthenticated && (
            <Button
              onClick={() => setUploadDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Contribute Resource
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search resources by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSelectedSubject("All");
                setSelectedType("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {resources.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Resources</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {resources.reduce(
                (total, r) => total + (r.download_count || 0),
                0
              )}
            </div>
            <div className="text-sm text-muted-foreground">Total Downloads</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatFileSize(
                resources.reduce((total, r) => total + (r.file_size || 0), 0)
              )}
            </div>
            <div className="text-sm text-muted-foreground">Total Storage</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {resources.filter((r) => r.file_type?.includes("pdf")).length}
            </div>
            <div className="text-sm text-muted-foreground">PDF Documents</div>
          </Card>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {filteredResources.length} of {resources.length} resources (
            {dbResources.length} database + {sampleResources.length} demo)
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                refetch();
              }}
            >
              🔄 Refresh
            </Button>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                <a href="/signin" className="text-primary hover:underline">
                  Sign in
                </a>{" "}
                to upload resources
              </p>
            )}
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ||
              selectedCategory !== "All" ||
              selectedSubject !== "All" ||
              selectedType !== "All"
                ? "Try adjusting your search or filters"
                : "Be the first to share a resource with the community"}
            </p>
            {isAuthenticated && (
              <Button
                onClick={() => setUploadDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload First Resource
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-card overflow-hidden"
              >
                <div className="relative bg-gradient-to-br from-muted/30 to-muted/60 h-48 flex items-center justify-center">
                  <div className="text-center">
                    {getTypeIcon(resource.file_type)}
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      {getTypeLabel(resource.file_type)}
                    </p>
                  </div>

                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 flex items-center gap-1"
                    >
                      {getTypeIcon(resource.file_type)}
                      {resource.category || "Academic"}
                    </Badge>
                  </div>

                  {resource.subject && !isAdmin && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-background/80">
                        {resource.subject}
                      </Badge>
                    </div>
                  )}

                  {/* Admin controls or subject badge */}
                  {isAdmin ? (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {resource.subject && (
                        <Badge variant="outline" className="bg-background/80">
                          {resource.subject}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-background/80 hover:bg-background"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(resource)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(resource)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    resource.subject && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="outline" className="bg-background/80">
                          {resource.subject}
                        </Badge>
                      </div>
                    )
                  )}

                  {resource.course_code && (
                    <div className="absolute bottom-4 left-4">
                      <Badge
                        variant="outline"
                        className="bg-background/80 flex items-center gap-1"
                      >
                        <Hash className="h-3 w-3" />
                        {resource.course_code}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {resource.title}
                  </h3>

                  <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                    {resource.description || "No description provided"}
                  </p>

                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{resource.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Archive className="h-3 w-3" />
                        {formatFileSize(resource.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {resource.download_count || 0} downloads
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {getTypeLabel(resource.file_type)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleDownload(resource)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePreview(resource)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action Section */}
        {isAuthenticated && (
          <div className="text-center mt-12">
            <Card className="p-8 bg-gradient-accent border-0">
              <Upload className="h-12 w-12 mx-auto text-accent-foreground mb-4" />
              <h2 className="text-2xl font-bold text-accent-foreground mb-4">
                Share Your Knowledge
              </h2>
              <p className="text-accent-foreground/80 mb-6 max-w-2xl mx-auto">
                Help your fellow students succeed by contributing your study
                materials, project reports, useful tools, and educational
                resources to our community library.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setUploadDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Upload Resource
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UploadResourceDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadSuccess={() => {
          console.log("DEBUG: Upload success, triggering refetch...");
          refetch();
        }}
      />

      <ResourcePreviewDialog
        resource={previewResource}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onDownload={handleDownload}
        getPreviewUrl={getResourcePreviewUrl}
      />

      <EditResourceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        resource={editingResource}
        onEditSuccess={() => {
          console.log("DEBUG: Edit success, triggering refetch...");
          refetch();
        }}
      />
    </Layout>
  );
};

export default Resources;
