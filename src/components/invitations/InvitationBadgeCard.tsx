import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, Crown, Gem, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface BadgeInfo {
  key: string;
  name: string;
  icon: string;
  color_primary: string;
  level: number;
}

interface NextBadgeInfo {
  key: string;
  name: string;
  required: number;
}

interface InvitationBadgeCardProps {
  currentBadge: BadgeInfo | null;
  nextBadge: NextBadgeInfo | null;
  progress: number;
  acceptedCount: number;
}

const iconMap = {
  Users,
  Award,
  Crown,
  Gem,
};

export function InvitationBadgeCard({
  currentBadge,
  nextBadge,
  progress,
  acceptedCount,
}: InvitationBadgeCardProps) {
  const BadgeIcon = currentBadge ? iconMap[currentBadge.icon as keyof typeof iconMap] || Users : Users;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Votre Badge de Parrainage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentBadge ? (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <div
                className="p-4 rounded-full"
                style={{ backgroundColor: `${currentBadge.color_primary}20` }}
              >
                <BadgeIcon
                  className="h-12 w-12"
                  style={{ color: currentBadge.color_primary }}
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">{currentBadge.name}</p>
                <Badge variant="secondary" className="mt-1">
                  Niveau {currentBadge.level}
                </Badge>
              </div>
            </motion.div>

            {nextBadge && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prochain badge</span>
                  <span className="font-medium">{nextBadge.name}</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {acceptedCount} / {nextBadge.required} invitations acceptées ({Math.round(progress)}%)
                </p>
              </div>
            )}

            {!nextBadge && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">
                  🎉 Vous avez atteint le niveau maximum !
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="p-4 rounded-full bg-muted inline-flex">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium mb-1">Aucun badge pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Invitez vos amis pour débloquer votre premier badge !
              </p>
            </div>
            {nextBadge && (
              <div className="mt-4 space-y-2">
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {acceptedCount} / {nextBadge.required} pour {nextBadge.name}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
