import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContributionBadge } from './ContributionBadge';
import { useUserBadges } from '@/hooks/useUserBadges';
import { Skeleton } from './ui/skeleton';
import { Award, Trophy, Users, Target } from 'lucide-react';

export const AllBadgesCollection = () => {
  const { badges, loading, toggleShowcase } = useUserBadges();

  const categoryIcons = {
    contribution: Trophy,
    achievement: Target,
    community: Users,
    birthday: Award
  };

  const categoryLabels = {
    contribution: 'Contributions',
    achievement: 'Accomplissements',
    community: 'Communauté',
    birthday: 'Anniversaires'
  };

  const badgesByCategory = {
    contribution: badges.filter(b => b.category === 'contribution'),
    achievement: badges.filter(b => b.category === 'achievement'),
    community: badges.filter(b => b.category === 'community'),
    birthday: badges.filter(b => b.category === 'birthday')
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection de Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-28 w-28 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Collection de Badges</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Award className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Aucun badge gagné
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Commencez à contribuer aux cagnottes, à créer des événements et à ajouter des amis pour débloquer vos premiers badges !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Collection de Badges
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {badges.length} badge{badges.length > 1 ? 's' : ''} débloqué{badges.length > 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Tous</TabsTrigger>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              const count = badgesByCategory[key as keyof typeof badgesByCategory].length;
              return (
                <TabsTrigger key={key} value={key} disabled={count === 0}>
                  <Icon className="h-4 w-4 mr-1" />
                  {label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {badges.map(badge => (
                <ContributionBadge
                  key={badge.id}
                  badge={badge}
                  size="md"
                  showActions
                  onToggleShowcase={toggleShowcase}
                />
              ))}
            </div>
          </TabsContent>

          {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
            <TabsContent key={category} value={category} className="mt-6">
              {categoryBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categoryBadges.map(badge => (
                    <ContributionBadge
                      key={badge.id}
                      badge={badge}
                      size="md"
                      showActions
                      onToggleShowcase={toggleShowcase}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    Aucun badge dans cette catégorie
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
