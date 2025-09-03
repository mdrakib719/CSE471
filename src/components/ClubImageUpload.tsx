import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/lib/cloudinary";
import { useToast } from "@/components/ui/use-toast";

interface ClubImageUploadProps {
  clubImageUrl?: string;
  onImageUpload: (imageUrl: string) => void;
  onImageRemove?: () => void;
}

const ClubImageUpload: React.FC<ClubImageUploadProps> = ({
  clubImageUrl,
  onImageUpload,
  onImageRemove
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await uploadImageToCloudinary(file, 'club-images');
      onImageUpload(imageUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Club image has been uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
      toast({
        title: "Image Removed",
        description: "Club image has been removed",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Club Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clubImageUrl ? (
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={getOptimizedImageUrl(clubImageUrl, 400, 300)}
                alt="Club Image"
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRemoveImage}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
            
            <Label htmlFor="replace-image" className="block">
              <Button
                variant="outline"
                className="w-full"
                disabled={isUploading}
                asChild
              >
                <div className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Replace Image'}
                </div>
              </Button>
              <input
                id="replace-image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </Label>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isUploading && document.getElementById('club-image-upload')?.click()}
            >
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isUploading ? 'Uploading...' : 'Upload Club Image'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Max 5MB • JPG, PNG, GIF
              </p>
            </div>

            <input
              id="club-image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubImageUpload;
