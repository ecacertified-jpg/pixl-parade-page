import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { usePlan } from './usePlan';
import { WaveCheckoutModal } from './WaveCheckoutModal';
import { cn } from '@/lib/utils';

interface Props {
  /** Affiche le badge uniquement si vrai (ex: l'utilisateur courant est propriétaire). */
  visible: boolean;
  className?: string;
}

/**
 * Badge rouge "Plan expiré" visible uniquement par le propriétaire d'une page
 * d'anniversaire ou d'événement, lorsque son abonnement payant a expiré.
 */
export function PlanExpiredBadge({ visible, className }: Props) {
  const { subscription, plan, allPlans } = usePlan();
  const [open, setOpen] = useState(false);

  if (!visible || !subscription) return null;

  const now = Date.now();
  const endTs = subscription.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;

  const isExpired =
    subscription.plan_tier !== 'free' &&
    (subscription.status === 'past_due' ||
      subscription.status === 'canceled' ||
      (endTs !== null && endTs < now));

  if (!isExpired) return null;

  const targetPlan =
    allPlans.find((p) => p.tier === subscription.plan_tier) ?? plan;
  const amountXof = targetPlan
    ? subscription.billing_cycle === 'yearly'
      ? Number(targetPlan.price_xof_yearly)
      : Number(targetPlan.price_xof_monthly)
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-red-700',
          className,
        )}
        aria-label="Plan expiré — renouveler"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        Plan {targetPlan?.name ?? subscription.plan_tier} expiré · Renouveler
      </button>
      {open && targetPlan && (
        <WaveCheckoutModal
          open
          onClose={() => setOpen(false)}
          planTier={subscription.plan_tier as 'essentiel' | 'premium'}
          planName={targetPlan.name}
          billingCycle={subscription.billing_cycle}
          amountXof={amountXof}
        />
      )}
    </>
  );
}