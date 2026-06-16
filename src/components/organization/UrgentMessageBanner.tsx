import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePublicUrgentMessage } from '@/hooks/useUrgentMessage';
import type { OrganizationPageType } from '@/types/organization';
import { cn } from '@/lib/utils';

interface Props {
  pageType: OrganizationPageType;
  pageId: string;
}

/** Red blinking urgent message banner shown on public birthday/event pages. */
export const UrgentMessageBanner = ({ pageType, pageId }: Props) => {
  const { message } = usePublicUrgentMessage(pageType, pageId);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  if (!message) return null;

  const eventDate = message.event_at ? new Date(message.event_at) : null;
  const dateLabel = eventDate
    ? format(eventDate, "EEEE d MMMM 'à' HH'h'mm", { locale: fr })
    : null;

  return (
    <section className="px-4 py-2" aria-live="polite">
      <div
        role="alert"
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-destructive bg-destructive text-destructive-foreground shadow-lg px-4 py-3',
          !reducedMotion && 'animate-urgent-blink'
        )}
      >
        {/* Halo pulse */}
        {!reducedMotion && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-destructive/40 animate-ping"
          />
        )}
        <div className="relative flex items-start gap-3">
          <div className="rounded-full bg-destructive-foreground/15 p-1.5 shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-poppins text-sm font-semibold uppercase tracking-wide opacity-90">
              Info importante
            </p>
            <p className="font-nunito text-sm leading-snug mt-0.5 whitespace-pre-wrap break-words">
              {message.message}
            </p>
            {dateLabel && (
              <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-destructive-foreground/15 px-2.5 py-0.5 text-xs font-medium">
                📅 {dateLabel}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};