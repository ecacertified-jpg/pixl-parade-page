import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusinessFollow } from '@/hooks/useBusinessFollow';
import { cn } from '@/lib/utils';

interface FollowBusinessButtonProps {
  businessId: string;
  businessName?: string;
  variant?: 'default' | 'compact';
  showCount?: boolean;
  className?: string;
}

export function FollowBusinessButton({
  businessId,
  businessName,
  variant = 'default',
  showCount = true,
  className
}: FollowBusinessButtonProps) {
  const { isFollowing, followersCount, loading, toggleFollow } = useBusinessFollow(businessId);

  if (variant === 'compact') {
    return (
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={toggleFollow}
        disabled={loading}
        className={cn(
          'transition-all',
          isFollowing && 'border-primary text-primary',
          className
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={toggleFollow}
      disabled={loading}
      className={cn(
        'transition-all gap-2',
        isFollowing && 'border-primary text-primary hover:bg-primary/10',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <BellOff className="h-4 w-4" />
          <span>Suivi</span>
          {showCount && followersCount > 0 && (
            <span className="text-xs opacity-70">({followersCount})</span>
          )}
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          <span>Suivre</span>
          {showCount && followersCount > 0 && (
            <span className="text-xs opacity-70">({followersCount})</span>
          )}
        </>
      )}
    </Button>
  );
}
