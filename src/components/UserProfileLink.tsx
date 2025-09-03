import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';

interface UserProfileLinkProps {
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
  variant?: 'default' | 'hover' | 'button';
  disabled?: boolean;
}

export const UserProfileLink: React.FC<UserProfileLinkProps> = ({
  user,
  size = 'md',
  showName = true,
  showEmail = false,
  className = '',
  nameClassName = '',
  variant = 'default',
  disabled = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!disabled) {
      navigate(`/profile/${user.id}`);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'hover':
        return 'hover:bg-muted/50 rounded-md px-2 py-1 transition-colors';
      case 'button':
        return 'hover:bg-muted rounded-md px-3 py-2 transition-colors border border-transparent hover:border-border';
      default:
        return '';
    }
  };

  return (
    <UserAvatar
      user={user}
      size={size}
      showName={showName}
      showEmail={showEmail}
      className={cn(
        getVariantClasses(),
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
      nameClassName={cn(
        variant === 'default' && !disabled && 'hover:text-primary transition-colors',
        nameClassName
      )}
      onClick={handleClick}
    />
  );
};

export default UserProfileLink;
