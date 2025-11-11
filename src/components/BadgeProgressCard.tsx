import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Gift, Users, Target, Heart, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from './ui/skeleton';

interface BadgeProgress {
  contributionCount: number;
  totalAmountDonated: number;
  fundsCreated: number;
  successfulFunds: number;
  friendsCount: number;
  thanksSent: number;
  surpriseEvents: number;
}

export const BadgeProgressCard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<BadgeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .rpc('get_user_badge_progress', { p_user_id: user.id });

        if (error) throw error;

        if (data && data.length > 0) {
          setProgress({
            contributionCount: data[0].contribution_count || 0,
            totalAmountDonated: Number(data[0].total_amount_donated) || 0,
            fundsCreated: data[0].funds_created || 0,
            successfulFunds: data[0].successful_funds || 0,
            friendsCount: data[0].friends_count || 0,
            thanksSent: data[0].thanks_sent || 0,
            surpriseEvents: data[0].surprise_events || 0
          });
        }
      } catch (error) {
        console.error('Error fetching badge progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progression des Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!progress) return null;

  const progressItems = [
    {
      icon: Gift,
      label: 'Contributions',
      current: progress.contributionCount,
      thresholds: [5, 10, 25, 50, 100],
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Trophy,
      label: 'Montant donné',
      current: progress.totalAmountDonated,
      thresholds: [50000, 100000, 250000, 500000, 1000000],
      color: 'from-blue-500 to-cyan-500',
      format: (val: number) => `${(val / 1000).toFixed(0)}k FCFA`
    },
    {
      icon: Target,
      label: 'Cagnottes créées',
      current: progress.fundsCreated,
      thresholds: [3, 10, 25, 50, 100],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Sparkles,
      label: 'Objectifs atteints',
      current: progress.successfulFunds,
      thresholds: [3, 10, 25, 50, 100],
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Users,
      label: 'Amis ajoutés',
      current: progress.friendsCount,
      thresholds: [10, 25, 50, 100, 250],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Heart,
      label: 'Remerciements',
      current: progress.thanksSent,
      thresholds: [25],
      color: 'from-red-500 to-pink-500',
      isSingleBadge: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Progression des Badges
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Débloquez des badges en participant à la communauté
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {progressItems.map((item, index) => {
          const Icon = item.icon;
          const nextThreshold = item.thresholds.find(t => t > item.current) || item.thresholds[item.thresholds.length - 1];
          const prevThreshold = [...item.thresholds].reverse().find(t => t <= item.current) || 0;
          const progressPercent = item.isSingleBadge
            ? (item.current / nextThreshold) * 100
            : ((item.current - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
          const isMaxLevel = item.current >= item.thresholds[item.thresholds.length - 1];

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {item.format ? item.format(item.current) : item.current}
                  {!isMaxLevel && ` / ${item.format ? item.format(nextThreshold) : nextThreshold}`}
                </span>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={Math.min(progressPercent, 100)} 
                  className="h-2"
                />
                {isMaxLevel ? (
                  <p className="text-xs text-center text-primary font-medium">
                    ✨ Niveau maximum atteint !
                  </p>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    {item.isSingleBadge 
                      ? `${nextThreshold - item.current} restant${nextThreshold - item.current > 1 ? 's' : ''}`
                      : `Encore ${nextThreshold - item.current} pour le prochain niveau`
                    }
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
