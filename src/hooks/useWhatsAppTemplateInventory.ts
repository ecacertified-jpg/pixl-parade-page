import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateDefinition {
  name: string;
  description: string;
  edgeFunction: string;
  needsMetaCreation?: boolean;
}

export type TemplateStatus = 'active' | 'degraded' | 'failing' | 'never_sent' | 'not_in_meta';

export interface TemplateInventoryItem extends TemplateDefinition {
  status: TemplateStatus;
  total: number;
  sent: number;
  failed: number;
  successRate: number;
  lastSentAt: string | null;
}

const KNOWN_TEMPLATES: TemplateDefinition[] = [
  { name: 'joiedevivre_otp', description: 'Vérification OTP', edgeFunction: 'send-whatsapp-otp' },
  { name: 'joiedevivre_contact_added', description: 'Notification ajout de contact', edgeFunction: 'notify-contact-added' },
  { name: 'joiedevivre_birthday_reminder', description: 'Rappel anniversaire (utilisateur)', edgeFunction: 'birthday-reminder-with-suggestions' },
  { name: 'joiedevivre_birthday_friend_alert', description: 'Alerte amis du cercle (anniversaire)', edgeFunction: 'birthday-reminder-with-suggestions' },
  { name: 'joiedevivre_birthday_create_fund_nudge', description: 'Incitation à créer une cagnotte (J-15)', edgeFunction: 'birthday-reminder-with-suggestions' },
  { name: 'joiedevivre_birthday_celebration', description: 'Vidéo célébration anniversaire', edgeFunction: 'birthday-reminder-with-suggestions' },
  { name: 'joiedevivre_refund_alert', description: 'Alerte de remboursement', edgeFunction: 'process-refund' },
  { name: 'joiedevivre_contribution_reminder', description: 'Rappel de contribution', edgeFunction: 'send-contribution-reminders' },
  { name: 'joiedevivre_gift_order', description: 'Notification cadeau commandé', edgeFunction: 'notify-gift-order' },
  { name: 'joiedevivre_group_contribution', description: 'Invitation cagnottes groupées', edgeFunction: 'notify-group-contribution' },
  { name: 'joiedevivre_fund_beneficiary_invite', description: 'Invitation bénéficiaire non inscrit', edgeFunction: 'notify-fund-beneficiary' },
  { name: 'joiedevivre_contribution_update', description: 'Mise à jour progression cagnotte', edgeFunction: 'send-contribution-reminders' },
  { name: 'joiedevivre_fund_ready', description: 'Cagnotte atteint 100% (prestataire)', edgeFunction: 'check-fund-completion' },
  { name: 'joiedevivre_fund_completed', description: 'Félicitations cagnotte complétée', edgeFunction: 'check-fund-completion' },
  { name: 'joiedevivre_new_order', description: 'Notification nouvelle commande (prestataire)', edgeFunction: 'notify-business-order' },
  { name: 'joiedevivre_order_confirmed', description: 'Confirmation commande (client)', edgeFunction: 'handle-order-action' },
  { name: 'joiedevivre_order_rejected', description: 'Rejet commande (client)', edgeFunction: 'handle-order-action' },
  { name: 'joiedevivre_join_reminder', description: 'Rappel inscription contacts non inscrits', edgeFunction: 'notify-contacts-join-reminder' },
  { name: 'joiedevivre_delivery_reminder', description: 'Rappel confirmation livraison', edgeFunction: 'check-delivery-confirmation-reminder' },
  { name: 'joiedevivre_welcome_add_friends', description: 'Bienvenue post-inscription', edgeFunction: 'check-friends-circle-reminders' },
  { name: 'joiedevivre_friends_circle_reminder', description: 'Rappel étoffer cercle d\'amis', edgeFunction: 'check-friends-circle-reminders' },
];

function computeStatus(def: TemplateDefinition, total: number, sent: number, failed: number): TemplateStatus {
  if (def.needsMetaCreation && total === 0) return 'not_in_meta';
  if (total === 0) return 'never_sent';
  const rate = (sent / total) * 100;
  if (failed === total) return 'failing';
  if (rate < 80) return 'degraded';
  return 'active';
}

const STATUS_ORDER: Record<TemplateStatus, number> = {
  failing: 0,
  not_in_meta: 1,
  never_sent: 2,
  degraded: 3,
  active: 4,
};

export function useWhatsAppTemplateInventory() {
  return useQuery<TemplateInventoryItem[]>({
    queryKey: ['whatsapp-template-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_template_logs')
        .select('template_name, status, created_at');

      if (error) throw error;

      const statsMap = new Map<string, { total: number; sent: number; failed: number; lastSentAt: string | null }>();

      for (const row of data || []) {
        const existing = statsMap.get(row.template_name) || { total: 0, sent: 0, failed: 0, lastSentAt: null };
        existing.total++;
        if (row.status === 'sent') existing.sent++;
        else existing.failed++;
        if (!existing.lastSentAt || row.created_at > existing.lastSentAt) {
          existing.lastSentAt = row.created_at;
        }
        statsMap.set(row.template_name, existing);
      }

      const items: TemplateInventoryItem[] = KNOWN_TEMPLATES.map((def) => {
        const stats = statsMap.get(def.name) || { total: 0, sent: 0, failed: 0, lastSentAt: null };
        const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
        return {
          ...def,
          ...stats,
          successRate,
          status: computeStatus(def, stats.total, stats.sent, stats.failed),
        };
      });

      // Also include unknown templates from logs
      for (const [name, stats] of statsMap) {
        if (!KNOWN_TEMPLATES.find((t) => t.name === name)) {
          const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
          items.push({
            name,
            description: 'Template inconnu',
            edgeFunction: '—',
            ...stats,
            successRate,
            status: computeStatus({ name, description: '', edgeFunction: '' }, stats.total, stats.sent, stats.failed),
          });
        }
      }

      items.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      return items;
    },
    staleTime: 60_000,
  });
}
