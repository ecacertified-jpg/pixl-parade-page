import { Award, Lock, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FriendsCircleBadgeProgressProps {
  currentFriendsCount: number;
}

const FRIEND_BADGES = [
  { key: 'first_circle', threshold: 2, name: 'Premier Cercle', icon: '🤝', color: 'bg-primary' },
  { key: 'growing_circle', threshold: 5, name: 'Cercle en Croissance', icon: '🌱', color: 'bg-green-500' },
  { key: 'social_butterfly', threshold: 10, name: 'Papillon Social', icon: '🦋', color: 'bg-pink-500' },
  { key: 'network_builder', threshold: 25, name: 'Bâtisseur de Réseau', icon: '🌐', color: 'bg-blue-500' },
  { key: 'community_leader', threshold: 50, name: 'Leader Communautaire', icon: '👑', color: 'bg-amber-500' },
];

export function FriendsCircleBadgeProgress({ currentFriendsCount }: FriendsCircleBadgeProgressProps) {
  // Find next badge to unlock
  const nextBadge = FRIEND_BADGES.find(badge => currentFriendsCount < badge.threshold);
  const unlockedBadges = FRIEND_BADGES.filter(badge => currentFriendsCount >= badge.threshold);
  const latestUnlocked = unlockedBadges[unlockedBadges.length - 1];
  
  const progress = nextBadge 
    ? Math.min((currentFriendsCount / nextBadge.threshold) * 100, 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Current/Latest Badge */}
      {latestUnlocked && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
            latestUnlocked.color
          )}>
            {latestUnlocked.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-poppins font-medium text-foreground">
                {latestUnlocked.name}
              </span>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">
              Badge obtenu !
            </span>
          </div>
        </div>
      )}

      {/* Next Badge Progress */}
      {nextBadge && (
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl opacity-50">
              {nextBadge.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="font-poppins text-sm font-medium text-muted-foreground">
                  {nextBadge.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentFriendsCount}/{nextBadge.threshold} amis
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Plus que {nextBadge.threshold - currentFriendsCount} ami{nextBadge.threshold - currentFriendsCount > 1 ? 's' : ''} pour débloquer !
          </p>
        </div>
      )}

      {/* All Badges Preview */}
      <div className="flex gap-2 justify-center">
        {FRIEND_BADGES.map((badge) => {
          const isUnlocked = currentFriendsCount >= badge.threshold;
          return (
            <div
              key={badge.key}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                isUnlocked ? badge.color : "bg-muted opacity-40"
              )}
              title={`${badge.name} (${badge.threshold} amis)`}
            >
              {badge.icon}
            </div>
          );
        })}
      </div>
    </div>
  );
}
