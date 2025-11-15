import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Award, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Reward {
  id: string;
  reward_type: 'points' | 'badge' | 'discount';
  reward_value: any;
  earned_at: string;
}

interface RewardsSectionProps {
  rewards: Reward[];
  onClaim: (rewardId: string) => Promise<{ success: boolean }>;
  claiming?: boolean;
}

export function RewardsSection({ rewards, onClaim, claiming }: RewardsSectionProps) {
  const handleClaim = async (rewardId: string) => {
    await onClaim(rewardId);
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points':
        return Gift;
      case 'badge':
        return Award;
      case 'discount':
        return Percent;
      default:
        return Gift;
    }
  };

  const getRewardLabel = (reward: Reward) => {
    switch (reward.reward_type) {
      case 'points':
        return `${reward.reward_value.points} points`;
      case 'badge':
        return `Badge "${reward.reward_value.badge_name}"`;
      case 'discount':
        return `${reward.reward_value.percentage}% de réduction`;
      default:
        return 'Récompense';
    }
  };

  if (rewards.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Récompenses disponibles ({rewards.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rewards.map((reward, index) => {
            const Icon = getRewardIcon(reward.reward_type);
            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-card border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{getRewardLabel(reward)}</p>
                    <p className="text-xs text-muted-foreground">
                      Gagné {new Date(reward.earned_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleClaim(reward.id)}
                  disabled={claiming}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  {claiming ? 'Réclamation...' : 'Réclamer'}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
