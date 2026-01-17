import { Users, TrendingUp, TrendingDown, UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useBusinessFollowers } from '@/hooks/useBusinessFollowers';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface BusinessFollowersSectionProps {
  businessId: string;
}

export function BusinessFollowersSection({ businessId }: BusinessFollowersSectionProps) {
  const navigate = useNavigate();
  const { stats, recentFollowers, loading, error } = useBusinessFollowers(businessId);

  if (loading) {
    return (
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Mes abonnés</h3>
            <p className="text-sm text-muted-foreground">
              Qui suit votre boutique
            </p>
          </div>
        </div>
        {stats.totalFollowers > 5 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => navigate('/business-followers')}
          >
            Tout voir
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Total */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.totalFollowers}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Abonnés
          </div>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{stats.newThisWeek}
            </span>
            {stats.weeklyGrowthPercent !== 0 && (
              <div className={`flex items-center text-xs ${
                stats.weeklyGrowthPercent > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.weeklyGrowthPercent > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Cette semaine
          </div>
        </div>

        {/* Today */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            +{stats.newToday}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Aujourd'hui
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      {stats.growthData.some(d => d.count > 0) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Évolution (7 jours)
          </h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.growthData}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} abonné${value > 1 ? 's' : ''}`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Followers */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Nouveaux abonnés
        </h4>
        
        {recentFollowers.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Aucun abonné pour l'instant
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Partagez votre boutique pour attirer des clients
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFollowers.map((follower) => (
              <div 
                key={follower.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={follower.followerAvatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(follower.followerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {follower.followerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Abonné {formatDistanceToNow(new Date(follower.followedAt), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Nouveau
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
