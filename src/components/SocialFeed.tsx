import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PostAuthor } from './PostAuthor';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share } from 'lucide-react';

interface SocialPost {
  id: string;
  content: string;
  image_url?: string;
  created_by: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface SocialFeedProps {
  posts: SocialPost[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
  posts,
  onLike,
  onComment,
  onShare
}) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="w-full">
          <CardHeader className="pb-3">
            <PostAuthor
              userId={post.created_by}
              authorName={post.author_name}
              size="md"
              timestamp={post.created_at}
              showTimestamp={true}
              variant="hover"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed mb-4">
              {post.content}
            </p>
            
            {post.image_url && (
              <div className="mb-4">
                <img
                  src={post.image_url}
                  alt="Post image"
                  className="w-full max-w-md rounded-lg"
                />
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike?.(post.id)}
                className="flex items-center gap-1"
              >
                <Heart className="h-4 w-4" />
                {post.likes_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment?.(post.id)}
                className="flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(post.id)}
                className="flex items-center gap-1"
              >
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SocialFeed;
