import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showEmail?: boolean;
  className?: string;
  nameClassName?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: {
    avatar: 'h-6 w-6',
    text: 'text-xs',
    name: 'text-xs'
  },
  md: {
    avatar: 'h-8 w-8',
    text: 'text-sm',
    name: 'text-sm'
  },
  lg: {
    avatar: 'h-10 w-10',
    text: 'text-base',
    name: 'text-base'
  },
  xl: {
    avatar: 'h-12 w-12',
    text: 'text-lg',
    name: 'text-lg'
  }
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = false,
  showEmail = false,
  className = '',
  nameClassName = '',
  onClick
}) => {
  const sizeConfig = sizeClasses[size];
  const initials = user.full_name
    ?.split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div 
      className={cn(
        'flex items-center gap-2',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      <Avatar className={sizeConfig.avatar}>
        <AvatarImage 
          src={user.avatar_url} 
          alt={user.full_name || 'User'} 
        />
        <AvatarFallback className={sizeConfig.text}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showName && (
        <div className="flex flex-col">
          <span className={cn(
            'font-medium text-foreground',
            sizeConfig.name,
            nameClassName
          )}>
            {user.full_name || 'Anonymous'}
          </span>
          {showEmail && user.email && (
            <span className={cn(
              'text-muted-foreground',
              sizeConfig.text
            )}>
              {user.email}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
