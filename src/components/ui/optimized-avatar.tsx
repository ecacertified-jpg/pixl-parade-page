import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAvatarCache } from '@/hooks/useAvatarCache';

interface OptimizedAvatarProps {
  userId?: string | null;
  avatarUrl?: string | null;
  name?: string;
  fallback?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function OptimizedAvatar({
  userId,
  avatarUrl,
  name = 'User',
  fallback,
  size = 40,
  className,
  onClick,
}: OptimizedAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { optimizedUrl } = useAvatarCache(userId, avatarUrl);

  const initials = fallback || name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = `w-[${size}px] h-[${size}px]`;

  return (
    <Avatar 
      className={cn(
        sizeClass,
        'relative overflow-hidden',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && optimizedUrl && (
        <Skeleton className="absolute inset-0 rounded-full animate-pulse" />
      )}
      
      {/* Avatar image */}
      {optimizedUrl && !imageError && (
        <AvatarImage
          src={optimizedUrl}
          alt={name}
          className={cn(
            'object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          loading="lazy"
        />
      )}
      
      {/* Fallback */}
      <AvatarFallback 
        className={cn(
          'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium transition-opacity duration-300',
          imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
