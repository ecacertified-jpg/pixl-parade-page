import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, PartyPopper } from "lucide-react";

interface Props {
  /** Local 'YYYY-MM-DD' event date. */
  eventDate: string | null | undefined;
  /** Optional label shown when there is more than 48h left (defaults to "Dans"). */
  prefixLabel?: string;
}

function parseLocalDate(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Event countdown:
 * - > 48h        : compact pill "Dans X jours"
 * - 0 < t ≤ 48h  : full timer "02 hrs : 10 min : 45 sec"
 * - ≤ 0          : "🎉 C'est aujourd'hui !"
 */
export function EventCountdown({ eventDate, prefixLabel = "Dans" }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!eventDate) return null;
  const target = parseLocalDate(eventDate);
  if (!target) return null;

  const diff = target.getTime() - now;
  const TWO_DAYS = 48 * 60 * 60 * 1000;

  // Base pill styling (matches BirthdayCountdown for visual consistency).
  const pillClass =
    "mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 backdrop-blur border border-primary/20 shadow-soft";

  if (diff <= 0) {
    // Same calendar day → "Aujourd'hui"; otherwise → "Terminé".
    const today = new Date();
    const isToday =
      today.getFullYear() === target.getFullYear() &&
      today.getMonth() === target.getMonth() &&
      today.getDate() === target.getDate();
    const gradient = isToday
      ? "from-celebration via-accent to-primary"
      : "from-primary to-accent";
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
        className={`mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${gradient} border border-white/40 shadow-soft`}
        aria-label={isToday ? "Le grand jour est arrivé" : "Événement terminé"}
      >
        {isToday ? (
          <PartyPopper className="h-4 w-4 md:h-5 md:w-5 text-white drop-shadow" />
        ) : (
          <Check className="h-4 w-4 md:h-5 md:w-5 text-white drop-shadow" strokeWidth={3} />
        )}
        <span className="font-poppins font-bold text-sm md:text-base text-white tracking-wide drop-shadow">
          {isToday ? "C'est aujourd'hui !" : "Événement terminé"}
        </span>
      </motion.div>
    );
  }

  if (diff > TWO_DAYS) {
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={pillClass}
        aria-label={`Dans ${days} jours`}
      >
        <span className="font-nunito text-xs md:text-sm text-muted-foreground">{prefixLabel}</span>
        <span className="font-poppins font-bold text-sm md:text-base text-foreground tabular-nums">
          {days}
        </span>
        <span className="font-nunito text-xs md:text-sm text-muted-foreground">
          {days > 1 ? "jours" : "jour"}
        </span>
      </motion.div>
    );
  }

  // Within 48h: full HH:MM:SS layout.
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const items = [
    { label: "hrs", value: hours },
    { label: "min", value: minutes },
    { label: "sec", value: seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={pillClass}
      aria-label="Compte à rebours avant l'événement"
    >
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <div className="flex items-baseline gap-0.5">
            <span className="font-poppins font-bold text-sm md:text-base text-foreground tabular-nums">
              {String(it.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground font-nunito">
              {it.label}
            </span>
          </div>
          {i < items.length - 1 && (
            <span className="text-muted-foreground/60 text-xs">:</span>
          )}
        </div>
      ))}
    </motion.div>
  );
}