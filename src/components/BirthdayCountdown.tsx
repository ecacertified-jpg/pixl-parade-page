import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface BirthdayCountdownProps {
  /** Birthday in 'YYYY-MM-DD' (local). Year is replaced by the next occurrence. */
  birthday: string | null;
  /** Celebration year of the page (used to anchor the target date). */
  celebrationYear?: number;
}

function computeTarget(birthday: string, celebrationYear?: number): Date {
  // Parse local 'YYYY-MM-DD' to avoid UTC shifts
  const [, m, d] = birthday.split("-").map((v) => parseInt(v, 10));
  const now = new Date();
  const yearCandidate = celebrationYear || now.getFullYear();
  let target = new Date(yearCandidate, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  // If the celebration date already passed, point to next year
  if (target.getTime() < now.getTime() - 24 * 3600 * 1000) {
    target = new Date(now.getFullYear() + (now.getMonth() > (m - 1) || (now.getMonth() === m - 1 && now.getDate() > d) ? 1 : 0), (m || 1) - 1, d || 1);
  }
  return target;
}

function formatDiff(ms: number) {
  const sign = ms < 0 ? -1 : 1;
  const abs = Math.abs(ms);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);
  const seconds = Math.floor((abs / 1000) % 60);
  return { sign, days, hours, minutes, seconds };
}

export function BirthdayCountdown({ birthday, celebrationYear }: BirthdayCountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!birthday) return null;

  const target = computeTarget(birthday, celebrationYear);
  const diff = target.getTime() - now;
  const { sign, days, hours, minutes, seconds } = formatDiff(diff);

  const items = [
    { label: "jrs", value: days },
    { label: "hrs", value: hours },
    { label: "min", value: minutes },
    { label: "sec", value: seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-background/70 backdrop-blur border border-primary/20 shadow-soft"
      aria-label="Compte à rebours avant l'anniversaire"
    >
      {sign < 0 && (
        <span className="text-xs font-semibold text-primary mr-0.5">-</span>
      )}
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