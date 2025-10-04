import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, Gift, Handshake, Sprout } from 'lucide-react';

interface ReciprocityBadgeProps {
  score: number;
  badge: 'newcomer' | 'helper' | 'generous' | 'champion';
  contributionsCount: number;
  totalAmount?: number;
}

export function ReciprocityBadge({ 
  score, 
  badge, 
  contributionsCount,
  totalAmount = 0 
}: ReciprocityBadgeProps) {
  const badgeConfig = {
    champion: { 
      icon: Crown, 
      label: 'Champion', 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    generous: { 
      icon: Gift, 
      label: 'Généreux', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    helper: { 
      icon: Handshake, 
      label: 'Contributeur', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    newcomer: { 
      icon: Sprout, 
      label: 'Nouveau', 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900',
      borderColor: 'border-gray-200 dark:border-gray-800'
    }
  };
  
  const config = badgeConfig[badge] || badgeConfig.newcomer;
  const Icon = config.icon;
  
  return (
    <Card className={`p-4 ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-background ${config.color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
            <span className="text-sm font-medium text-muted-foreground">
              {score}/100
            </span>
          </div>
          <div className="space-y-2">
            <Progress value={score} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{contributionsCount} contribution{contributionsCount !== 1 ? 's' : ''}</span>
              {totalAmount > 0 && (
                <span>{totalAmount.toLocaleString()} XOF donnés</span>
              )}
            </div>
          </div>
          {score < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              {score < 20 && "Commence à contribuer pour augmenter ton score !"}
              {score >= 20 && score < 50 && "Continue comme ça, tu es sur la bonne voie !"}
              {score >= 50 && score < 80 && "Excellent ! Tu es très généreux !"}
              {score >= 80 && "Presque au maximum ! Tu es un champion !"}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
