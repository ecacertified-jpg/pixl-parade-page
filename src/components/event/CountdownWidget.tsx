import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';

interface Props {
  /** ISO date 'YYYY-MM-DD' */
  eventDate: string | null | undefined;
  occasionEmoji?: string;
}

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return { days, hours, minutes };
}

export const CountdownWidget = ({ eventDate, occasionEmoji = '🎉' }: Props) => {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!eventDate) return null;
  const target = new Date(`${eventDate}T12:00:00`);
  const left = diff(target);

  return (
    <Card className="rounded-2xl p-4 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/30 border-primary/20">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/15 p-2">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-nunito">
            {left ? 'Compte à rebours' : 'Jour J'}
          </p>
          {left ? (
            <p className="font-poppins text-base font-semibold">
              {occasionEmoji} J-{left.days}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                · {left.hours}h {left.minutes}m
              </span>
            </p>
          ) : (
            <p className="font-poppins text-base font-semibold">{occasionEmoji} C'est aujourd'hui !</p>
          )}
        </div>
      </div>
    </Card>
  );
};