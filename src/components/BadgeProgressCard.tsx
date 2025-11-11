import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ReciprocityBadge, getBadgeByScore, BADGE_CONFIGS, BadgeLevel } from './ReciprocityBadge';
import { ArrowRight, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface BadgeProgressCardProps {
  currentScore: number;
}

export function BadgeProgressCard({ currentScore }: BadgeProgressCardProps) {
  const currentBadge = getBadgeByScore(currentScore);
  const allBadges = Object.values(BADGE_CONFIGS);
  
  // Find next badge
  const nextBadge = allBadges.find(b => b.minScore > currentScore);
  const progressToNext = nextBadge 
    ? ((currentScore - currentBadge.minScore) / (nextBadge.minScore - currentBadge.minScore)) * 100
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre Badge de Réciprocité</CardTitle>
        <CardDescription>
          Évoluez votre badge en contribuant à la communauté
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Badge Display */}
        <div className="flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
          <ReciprocityBadge score={currentScore} size="xl" showLabel showScore />
        </div>

        {/* Badge Description */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">{currentBadge.description}</p>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Avantages débloqués:</p>
            {currentBadge.perks.map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-xs"
              >
                <Unlock className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{perk}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress to Next Badge */}
        {nextBadge ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReciprocityBadge score={currentScore} size="sm" showLabel={false} animated={false} />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <ReciprocityBadge score={nextBadge.minScore} size="sm" showLabel={false} animated={false} />
              </div>
              <Badge variant="outline">
                {nextBadge.minScore - currentScore} pts
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progression vers {nextBadge.name}</span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Prochains avantages à débloquer:
              </p>
              {nextBadge.perks.slice(0, 2).map((perk, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="opacity-50">✓</span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-primary mb-2">
              🎉 Vous avez atteint le niveau maximum !
            </p>
            <p className="text-xs text-muted-foreground">
              Continuez à contribuer pour inspirer la communauté
            </p>
          </div>
        )}

        {/* All Badges Overview */}
        <div className="pt-4 border-t">
          <p className="text-xs font-semibold mb-3">Tous les badges:</p>
          <div className="grid grid-cols-4 gap-4">
            {allBadges.map((badge) => (
              <div
                key={badge.level}
                className={`flex flex-col items-center gap-1 transition-opacity ${
                  currentScore >= badge.minScore ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <ReciprocityBadge
                  score={badge.minScore}
                  size="sm"
                  showLabel={false}
                  animated={currentScore >= badge.minScore}
                />
                <p className="text-xs text-center font-medium">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.minScore}+</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}