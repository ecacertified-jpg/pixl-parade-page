import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReciprocityBadge, BADGE_CONFIGS } from './ReciprocityBadge';
import { Lock, Unlock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface AllBadgesCollectionProps {
  currentScore: number;
}

export function AllBadgesCollection({ currentScore }: AllBadgesCollectionProps) {
  const allBadges = Object.values(BADGE_CONFIGS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Collection de Badges
        </CardTitle>
        <CardDescription>
          Débloquez de nouveaux badges en augmentant votre score de réciprocité
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {allBadges.map((badge, index) => {
          const isUnlocked = currentScore >= badge.minScore;
          const isCurrent =
            currentScore >= badge.minScore &&
            (index === allBadges.length - 1 || currentScore < allBadges[index + 1].minScore);

          return (
            <motion.div
              key={badge.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative border rounded-lg p-4 transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-br from-background to-muted/30 border-primary/20'
                  : 'bg-muted/20 border-muted'
              }`}
            >
              {/* Current Badge Indicator */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Badge Actuel
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Badge Icon */}
                <div className="flex-shrink-0">
                  <ReciprocityBadge
                    score={badge.minScore}
                    size="lg"
                    showLabel={false}
                    animated={isUnlocked}
                  />
                </div>

                {/* Badge Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{badge.name}</h3>
                      {isUnlocked ? (
                        <Unlock className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requis: {badge.minScore}+ points de réciprocité
                    </p>
                  </div>

                  {/* Perks */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">
                      {isUnlocked ? 'Avantages débloqués:' : 'Avantages à débloquer:'}
                    </p>
                    <div className="space-y-1">
                      {badge.perks.map((perk, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + i * 0.05 }}
                          className={`flex items-start gap-2 text-xs ${
                            isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex-shrink-0 ${
                              isUnlocked ? 'text-green-500' : 'text-muted-foreground'
                            }`}
                          >
                            ✓
                          </span>
                          <span>{perk}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {!isUnlocked && (
                    <div className="bg-muted/50 rounded p-2 text-xs">
                      <p className="text-muted-foreground">
                        Encore <strong>{badge.minScore - currentScore} points</strong> pour
                        débloquer ce badge
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Tips Section */}
        <div className="bg-primary/5 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-sm mb-2">💡 Comment augmenter votre score ?</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Contribuez régulièrement aux cagnottes de vos proches</li>
            <li>• Créez des cagnottes pour célébrer les moments importants</li>
            <li>• Aidez vos amis à atteindre leurs objectifs</li>
            <li>• Maintenez un bon équilibre entre ce que vous recevez et donnez</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}