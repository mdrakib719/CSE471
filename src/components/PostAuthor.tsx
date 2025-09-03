import React from 'react';
import { UserProfileLink } from './UserProfileLink';
import { useUserData } from '@/hooks/useUserData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PostAuthorProps {
  userId: string;
  authorName?: string; // Fallback name if user data is not available
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showEmail?: boolean;
  className?: string;
  variant?: 'default' | 'hover' | 'button';
  timestamp?: string;
  showTimestamp?: boolean;
  disabled?: boolean;
}

export const PostAuthor: React.FC<PostAuthorProps> = ({
  userId,
  authorName,
  size = 'md',
  showEmail = false,
  className = '',
  variant = 'default',
  timestamp,
  showTimestamp = false,
  disabled = false
}) => {
  const { userData, loading, error } = useUserData(userId);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          {showTimestamp && <Skeleton className="h-3 w-16" />}
        </div>
      </div>
    );
  }

  if (error || !userData) {
    // Fallback to authorName if user data is not available
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
          {authorName?.charAt(0) || 'U'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {authorName || 'Anonymous'}
          </span>
          {showTimestamp && timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <UserProfileLink
        user={userData}
        size={size}
        showName={true}
        showEmail={showEmail}
        variant={variant}
        disabled={disabled}
        nameClassName="text-sm font-medium"
      />
      {showTimestamp && timestamp && (
        <span className="text-xs text-muted-foreground ml-2">
          {new Date(timestamp).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

export default PostAuthor;
