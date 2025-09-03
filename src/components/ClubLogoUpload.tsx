import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/lib/cloudinary";

interface ClubLogoUploadProps {
  logoUrl: string;
  onLogoUpload: (logoUrl: string) => void;
  onLogoRemove: () => void;
}

const ClubLogoUpload = ({ logoUrl, onLogoUpload, onLogoRemove }: ClubLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);



  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for logo)
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, 'club-logos');
      const optimizedUrl = getOptimizedImageUrl(uploadedUrl, 200, 200);
      onLogoUpload(optimizedUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="h-5 w-5 text-primary" />
          Club Logo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload your club logo (recommended: square format, max 5MB)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {logoUrl ? (
          <div className="relative">
            <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-border/50">
              <img
                src={logoUrl}
                alt="Club logo"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onLogoRemove}
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-6 w-6 text-primary" />
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground">
                  {uploading ? "Uploading..." : "Drop logo here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!logoUrl && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => document.querySelector('input[type="file"]')?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Logo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubLogoUpload;
