import { Button } from '@/components/ui/button';

interface OtpCountdownCircleProps {
  countdown: number;
  total: number;
  onResend: () => void;
  disabled: boolean;
}

const RADIUS = 22;
const STROKE_WIDTH = 3;
const SIZE = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OtpCountdownCircle({ countdown, total, onResend, disabled }: OtpCountdownCircleProps) {
  const progress = countdown / total;
  const offset = CIRCUMFERENCE * (1 - progress);
  const timeText = `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`;

  if (countdown <= 0) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onResend}
        disabled={disabled}
        className="text-primary hover:text-primary/80"
      >
        Renvoyer le code
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Progress circle */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 linear"
        />
      </svg>
      {/* Timer text overlaid on the circle */}
      <span
        className="text-xs font-poppins font-medium text-muted-foreground"
        style={{ marginTop: -35, marginBottom: 10 }}
      >
        {timeText}
      </span>
      <span className="text-xs text-muted-foreground">Renvoyer le code</span>
    </div>
  );
}
