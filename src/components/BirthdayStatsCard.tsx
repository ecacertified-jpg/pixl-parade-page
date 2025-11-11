import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BirthdayLoyaltyBadge } from './BirthdayLoyaltyBadge';
import { useBirthdayStats } from '@/hooks/useBirthdayStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Award, TrendingUp } from 'lucide-react';

export const BirthdayStatsCard = () => {
  const { stats, loading, error } = useBirthdayStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Impossible de charger vos statistiques
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalCelebrations === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl">🎂</div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Aucun anniversaire célébré
            </p>
            <p className="text-xs text-muted-foreground">
              Célébrez votre prochain anniversaire sur JOIE DE VIVRE pour débloquer votre premier badge !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse badge level to number for the component
  const badgeLevelMap: Record<string, number> = {
    'none': 0,
    'bronze': 1,
    'silver': 2,
    'gold': 3,
    'platinum': 4,
    'diamond': 5
  };

  const badgeLevel = badgeLevelMap[stats.badgeLevel] || 0;

  // Calculate progress to next badge
  const nextBadgeThresholds = [1, 2, 3, 5, 10];
  const currentThreshold = nextBadgeThresholds[badgeLevel - 1] || 0;
  const nextThreshold = nextBadgeThresholds[badgeLevel] || 10;
  const progress = badgeLevel === 5 
    ? 100 
    : ((stats.totalCelebrations - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Badges de Fidélité
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Badge Display */}
        <div className="flex justify-center">
          <BirthdayLoyaltyBadge
            level={badgeLevel}
            name={stats.badgeName}
            totalCelebrations={stats.totalCelebrations}
            size="lg"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {stats.totalCelebrations}
            </p>
            <p className="text-xs text-muted-foreground">
              Anniversaire{stats.totalCelebrations > 1 ? 's' : ''} célébré{stats.totalCelebrations > 1 ? 's' : ''}
            </p>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {stats.firstBirthdayOnPlatform 
                ? new Date().getFullYear() - new Date(stats.firstBirthdayOnPlatform).getFullYear()
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">
              An{(new Date().getFullYear() - (stats.firstBirthdayOnPlatform ? new Date(stats.firstBirthdayOnPlatform).getFullYear() : new Date().getFullYear())) > 1 ? 's' : ''} avec nous
            </p>
          </div>
        </div>

        {/* Progress to next badge */}
        {badgeLevel < 5 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Prochain badge: {['', '🥈 Argent', '🏆 Or', '⭐ Platine', '💎 Diamant', ''][badgeLevel]}
              </span>
              <span className="font-medium text-foreground">
                {stats.totalCelebrations}/{nextThreshold}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {nextThreshold - stats.totalCelebrations} anniversaire{nextThreshold - stats.totalCelebrations > 1 ? 's' : ''} restant{nextThreshold - stats.totalCelebrations > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Max level achievement */}
        {badgeLevel === 5 && (
          <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <p className="text-sm font-semibold text-foreground mb-1">
              ✨ Niveau Maximum Atteint !
            </p>
            <p className="text-xs text-muted-foreground">
              Vous êtes un membre exceptionnel de la communauté JOIE DE VIVRE
            </p>
          </div>
        )}

        {/* First birthday info */}
        {stats.firstBirthdayOnPlatform && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Membre depuis {new Date(stats.firstBirthdayOnPlatform).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
