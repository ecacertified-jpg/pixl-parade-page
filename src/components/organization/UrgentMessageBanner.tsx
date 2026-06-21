import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePublicUrgentMessages, type UrgentMessage, type UrgentPriority } from '@/hooks/useUrgentMessages';
import type { OrganizationPageType } from '@/types/organization';
import { cn } from '@/lib/utils';

interface Props {
  pageType: OrganizationPageType;
  pageId: string;
}

const PRIORITY_STYLES: Record<UrgentPriority, { container: string; label: string; Icon: typeof AlertTriangle; blink: boolean; ring: string }> = {
  high: {
    container: 'border-destructive bg-destructive text-destructive-foreground',
    label: 'Info urgente',
    Icon: AlertTriangle,
    blink: true,
    ring: 'ring-destructive/40',
  },
  medium: {
    container: 'border-amber-500 bg-amber-500 text-white',
    label: 'À noter',
    Icon: Bell,
    blink: false,
    ring: 'ring-amber-400/40',
  },
  low: {
    container: 'border-primary/40 bg-primary/10 text-foreground',
    label: 'Bon à savoir',
    Icon: Info,
    blink: false,
    ring: 'ring-primary/20',
  },
};

const formatDate = (iso: string | null) =>
  iso ? format(new Date(iso), "EEEE d MMMM 'à' HH'h'mm", { locale: fr }) : null;

const SingleBanner = ({ m, reducedMotion }: { m: UrgentMessage; reducedMotion: boolean }) => {
  const style = PRIORITY_STYLES[m.priority];
  const Icon = style.Icon;
  const dateLabel = formatDate(m.event_at);
  const animate = style.blink && !reducedMotion;

  return (
    <div
      role="alert"
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 shadow-lg px-4 py-3',
        style.container,
        animate && 'animate-urgent-blink'
      )}
    >
      {animate && (
        <span aria-hidden className={cn('pointer-events-none absolute inset-0 rounded-2xl ring-4 animate-ping', style.ring)} />
      )}
      <div className="relative flex items-start gap-3">
        <div className="rounded-full bg-white/20 p-1.5 shrink-0 mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-poppins text-xs font-semibold uppercase tracking-wide opacity-90">
            {style.label}
          </p>
          <p className="font-nunito text-sm leading-snug mt-0.5 whitespace-pre-wrap break-words">
            {m.message}
          </p>
          {dateLabel && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
              📅 {dateLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/** Stack of urgent messages (sorted: high → medium → low, then display_order). */
export const UrgentMessageBanner = ({ pageType, pageId }: Props) => {
  const { messages } = usePublicUrgentMessages(pageType, pageId);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Auto-rotate every 5s when 2+ messages and motion allowed
  useEffect(() => {
    if (messages.length < 2 || reducedMotion) return;
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % messages.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [messages.length, reducedMotion]);

  // Sync scroll position with activeIdx
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[activeIdx] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    }
  }, [activeIdx]);

  if (messages.length === 0) return null;

  // Single message: full width banner
  if (messages.length === 1) {
    return (
      <section className="px-4 py-2" aria-live="polite">
        <SingleBanner m={messages[0]} reducedMotion={reducedMotion} />
      </section>
    );
  }

  return (
    <section className="py-2" aria-live="polite">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-none"
        onScroll={(e) => {
          const el = e.currentTarget;
          const w = el.clientWidth;
          const idx = Math.round(el.scrollLeft / Math.max(w * 0.85, 1));
          if (idx !== activeIdx && idx >= 0 && idx < messages.length) setActiveIdx(idx);
        }}
      >
        {messages.map((m) => (
          <div key={m.id} className="snap-center shrink-0 w-[85%]">
            <SingleBanner m={m} reducedMotion={reducedMotion} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Messages">
        {messages.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={i === activeIdx}
            aria-label={`Message ${i + 1} sur ${messages.length}`}
            onClick={() => setActiveIdx(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === activeIdx ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </section>
  );
};