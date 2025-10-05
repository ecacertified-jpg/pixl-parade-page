import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface SurpriseCountdownProps {
  revealDate: string;
  currentAmount: number;
  targetAmount: number;
  contributorsCount: number;
}

export const SurpriseCountdown = ({
  revealDate,
  currentAmount,
  targetAmount,
  contributorsCount
}: SurpriseCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const reveal = new Date(revealDate);
      
      if (reveal <= now) {
        setTimeLeft(null);
        return;
      }

      const days = differenceInDays(reveal, now);
      const hours = differenceInHours(reveal, now) % 24;
      const minutes = differenceInMinutes(reveal, now) % 60;

      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [revealDate]);

  const progress = (currentAmount / targetAmount) * 100;

  const getMotivationMessage = () => {
    if (timeLeft === null) return "La révélation est imminente ! 🎉";
    if (timeLeft.days === 0 && timeLeft.hours < 24) return "C'est pour très bientôt ! 🔥";
    if (timeLeft.days <= 3) return `Plus que ${timeLeft.days} jours ! La surprise approche... 🎁`;
    if (timeLeft.days <= 7) return `Plus qu'une semaine ! Continuez de contribuer 💪`;
    return "La surprise se prépare en secret... 🤫";
  };

  return (
    <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
      <div className="space-y-4">
        {/* Header avec icône */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Cagnotte Surprise en cours</h3>
            <p className="text-sm text-muted-foreground">Chut... Le bénéficiaire ne sait rien !</p>
          </div>
        </div>

        {/* Compte à rebours */}
        {timeLeft && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="flex gap-4 text-center">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary">{timeLeft.days}</div>
                  <div className="text-xs text-muted-foreground">jours</div>
                </div>
                <div className="text-2xl font-bold text-muted-foreground">:</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary">{timeLeft.hours}</div>
                  <div className="text-xs text-muted-foreground">heures</div>
                </div>
                <div className="text-2xl font-bold text-muted-foreground">:</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary">{timeLeft.minutes}</div>
                  <div className="text-xs text-muted-foreground">min</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date de révélation */}
        <div className="text-center py-2 px-4 rounded-lg bg-primary/10">
          <p className="text-sm font-medium">
            Révélation prévue le {format(new Date(revealDate), "PPP 'à' HH:mm", { locale: fr })}
          </p>
        </div>

        {/* Progression (cachée au bénéficiaire mais visible aux contributeurs) */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression secrète</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {currentAmount.toLocaleString()} XOF collectés
            </span>
            <span className="text-muted-foreground">
              {contributorsCount} contributeur{contributorsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Message de motivation */}
        <div className="text-center py-3 px-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10">
          <p className="text-sm font-medium text-primary">
            {getMotivationMessage()}
          </p>
        </div>
      </div>
    </Card>
  );
};
