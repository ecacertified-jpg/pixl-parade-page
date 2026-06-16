import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from './usePlan';
import type { PremiumTrialStatus, TrialPhase, TrialTargetType } from './types';

/**
 * Hook contextuel pour le Premium offert.
 *
 * - Lit l'unique grant utilisateur via usePlan (cache partagé).
 * - Expose helpers pour savoir si l'item courant est couvert.
 * - log() permet d'envoyer un évènement analytics au backend
 *   (`log_premium_trial_event`).
 */
export const usePremiumTrial = (opts?: {
  targetType?: TrialTargetType;
  targetId?: string;
}) => {
  const { user } = useAuth();
  const { trial, trialPhase, state, isTrialCoveredItem, isLoading } = usePlan();
  const qc = useQueryClient();

  const coversThisItem = useMemo(() => {
    if (!opts?.targetType || !opts?.targetId) return false;
    return isTrialCoveredItem(opts.targetType, opts.targetId);
  }, [isTrialCoveredItem, opts?.targetType, opts?.targetId]);

  const isThisItemTarget = useMemo(() => {
    if (!trial || !opts?.targetType || !opts?.targetId) return false;
    return trial.target_type === opts.targetType && trial.target_id === opts.targetId;
  }, [trial, opts?.targetType, opts?.targetId]);

  const log = async (
    event_type:
      | 'unlock_viewed'
      | 'post_event_viewed'
      | 'memories_phase_entered'
      | 'upgrade_clicked'
      | 'converted'
      | 'archived',
    metadata: Record<string, unknown> = {}
  ) => {
    if (!user) return;
    try {
      await (supabase as any).rpc('log_premium_trial_event', {
        _event_type: event_type,
        _metadata: metadata,
      });
    } catch (e) {
      // silent
    }
  };

  /** Force le rafraîchissement (à appeler après création d'un item). */
  const refresh = () =>
    qc.invalidateQueries({ queryKey: ['premium-trial-status', user?.id] });

  return {
    trial,
    trialPhase,
    state,
    isLoading,
    /** L'item passé en paramètre est-il l'événement offert ET encore Premium ? */
    coversThisItem,
    /** L'item est-il celui ciblé par le trial (même hors phase active). */
    isThisItemTarget,
    /** true si l'user a un trial encore en phase active (jour J non passé). */
    isActive: trialPhase === 'active',
    /** true si on est dans la phase souvenirs (J+1 → J+7). */
    isMemories: trialPhase === 'memories',
    /** true si on est en phase limitée (J+8 → J+30). */
    isLimited: trialPhase === 'limited',
    /** true si la page est archivée (> J+30). */
    isArchived: trialPhase === 'archived',
    /** Jamais utilisé : aucun trial enregistré pour cet user. */
    isUnused: !trial,
    refresh,
    log,
  };
};

export type { PremiumTrialStatus, TrialPhase, TrialTargetType };