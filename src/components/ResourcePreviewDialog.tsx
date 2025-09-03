import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Eye,
  FileText,
  Video,
  Image,
  Archive,
  User,
  Calendar,
  Tag,
  BookOpen,
  Hash,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import type { Resource } from "@/lib/supabase";

interface ResourcePreviewDialogProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (resource: Resource) => void;
  getPreviewUrl?: (filePath: string) => Promise<string>;
}

export default function ResourcePreviewDialog({
  resource,
  open,
  onOpenChange,
  onDownload,
  getPreviewUrl,
}: ResourcePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const { toast } = useToast();

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-8 w-8 text-blue-500" />;
    if (fileType.includes("pdf"))
      return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes("video"))
      return <Video className="h-8 w-8 text-purple-500" />;
    if (fileType.includes("image"))
      return <Image className="h-8 w-8 text-green-500" />;
    if (fileType.includes("zip") || fileType.includes("rar"))
      return <Archive className="h-8 w-8 text-orange-500" />;
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canPreview = (fileType?: string) => {
    if (!fileType) return false;
    return (
      fileType.includes("image") ||
      fileType.includes("pdf") ||
      fileType.includes("text") ||
      fileType.includes("doc") ||
      fileType.includes("docx")
    );
  };

  const loadPreview = async () => {
    if (!resource || !canPreview(resource.file_type)) return;

    // Check if it's a sample resource
    if (resource.file_path.startsWith("sample/")) {
      toast({
        title: "Demo Resource",
        description: "Preview not available for demo resources",
        variant: "default",
      });
      return;
    }

    try {
      setIsLoadingPreview(true);

      if (!getPreviewUrl) {
        throw new Error("Preview function not available");
      }

      const url = await getPreviewUrl(resource.file_path);
      setPreviewUrl(url);

      // Load text content for text files
      if (resource.file_type?.includes("text")) {
        try {
          const response = await fetch(url);
          const content = await response.text();
          setTextContent(content);
        } catch (textError) {
          console.warn("Could not load text content:", textError);
          setTextContent("Text content could not be loaded");
        }
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
      // toast({
      //   // title: "Preview Error",
      //   // description: "Could not load preview for this file",
      //   // variant: "destructive",
      // });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!resource) return;

    try {
      if (onDownload) {
        await onDownload(resource);
      }
      toast({
        title: "Download Started",
        description: "Your file download should begin shortly",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download resource",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open && resource) {
      setPreviewUrl(null);
      if (canPreview(resource.file_type)) {
        loadPreview();
      }
    }
  }, [open, resource]);

  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getFileIcon(resource.file_type)}
            <span className="truncate">{resource.title}</span>
          </DialogTitle>
          <DialogDescription>
            {resource.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resource Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Uploaded by:</span>
                <span className="font-medium">
                  {(resource as any).profiles?.full_name || "Unknown User"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {formatDate(resource.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Archive className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">
                  {formatFileSize(resource.file_size)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Downloads:</span>
                <span className="font-medium">
                  {resource.download_count || 0}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="secondary">
                  {resource.category || "Academic"}
                </Badge>
              </div>

              {resource.subject && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Subject:</span>
                  <Badge variant="outline">{resource.subject}</Badge>
                </div>
              )}

              {resource.course_code && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Course:</span>
                  <Badge variant="outline">{resource.course_code}</Badge>
                </div>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="text-center">
              {/* <div className="text-2xl font-bold text-primary">
                {resource.download_count || 0}
              </div> */}
              {/* <div className="text-sm text-muted-foreground">
                Total Downloads
              </div> */}
            </div>
            <div className="text-center">
              {/* <div className="text-2xl font-bold text-green-600">
                {formatFileSize(resource.file_size)}
              </div> */}
              {/* <div className="text-sm text-muted-foreground">File Size</div> */}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resource.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
              </div>
              {/* <div className="text-sm text-muted-foreground">File Type</div> */}
            </div>
          </div>

          <Separator />

          {/* Preview Section */}
          {canPreview(resource.file_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                {/* {!previewUrl && (
                  <Button
                    variant="outline"
                    onClick={loadPreview}
                    disabled={isLoadingPreview}
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isLoadingPreview ? "Loading..." : "Load Preview"}
                  </Button>
                )} */}
              </div>

              {previewUrl && (
                <div className="border rounded-lg overflow-hidden bg-muted/10">
                  {resource.file_type?.includes("image") ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt={resource.title}
                        className="w-full max-h-96 object-contain"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        {resource.file_type}
                      </div>
                    </div>
                  ) : resource.file_type?.includes("pdf") ? (
                    <div className="relative">
                      <iframe
                        src={previewUrl}
                        className="w-full h-96"
                        title={resource.title}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        PDF Preview
                      </div>
                    </div>
                  ) : resource.file_type?.includes("doc") ||
                    resource.file_type?.includes("docx") ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p className="mb-2">Document Preview</p>
                      <p className="text-sm">
                        Microsoft Office documents can be previewed online
                      </p>
                      <div className="mt-4">
                        <a
                          href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                            previewUrl
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Open in Office Online
                        </a>
                      </div>
                    </div>
                  ) : resource.file_type?.includes("text") ? (
                    <div className="p-4">
                      <pre className="text-sm text-left overflow-auto max-h-96 bg-background p-4 rounded border">
                        <code>{textContent || "Loading text content..."}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Preview not available for this file type</p>
                      {/* <p className="text-sm mt-2">
                        File type: {resource.file_type}
                      </p> */}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Open link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}