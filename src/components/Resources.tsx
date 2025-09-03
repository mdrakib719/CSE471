import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PostAuthor } from './PostAuthor';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url?: string;
  file_type?: string;
  created_by: string;
  author_name: string;
  created_at: string;
  downloads_count: number;
  views_count: number;
}

interface ResourcesProps {
  resources: Resource[];
  onDownload?: (resourceId: string) => void;
  onView?: (resourceId: string) => void;
}

export const Resources: React.FC<ResourcesProps> = ({
  resources,
  onDownload,
  onView
}) => {
  const getFileIcon = (fileType?: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'xls':
      case 'xlsx':
        return '📈';
      default:
        return '📁';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <Card key={resource.id} className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">
                  {resource.title}
                </CardTitle>
                <PostAuthor
                  userId={resource.created_by}
                  authorName={resource.author_name}
                  size="sm"
                  timestamp={resource.created_at}
                  showTimestamp={true}
                  variant="hover"
                  className="mt-2"
                />
              </div>
              <div className="text-2xl">
                {getFileIcon(resource.file_type)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              {resource.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {resource.views_count} views
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {resource.downloads_count} downloads
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView?.(resource.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onDownload?.(resource.id)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Resources;
