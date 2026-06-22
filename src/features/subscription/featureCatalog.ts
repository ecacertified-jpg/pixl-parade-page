import type { PlanTier } from './types';

/**
 * Source unique de vérité fonctionnalité → plan minimum requis.
 * Sert de référence pour l'UI (FeatureGate, UpgradePromptModal) et la doc interne.
 * Les valeurs effectives (quotas, flags) sont lues dans `subscription_plans` (DB)
 * via `usePlan().getLimit` / `getFeature`.
 */
export type FeatureId =
  // pages
  | 'event_pages'
  | 'cover_video_custom'
  // album
  | 'album_photos_per_page'
  | 'album_export'
  // cagnottes
  | 'active_funds'
  | 'fund_commission_rate'
  // invités
  | 'guests_per_page'
  | 'rsvp_advanced'
  // coulisses
  | 'plan_de_table'
  | 'expense_management'
  | 'co_organizers'
  // souvenirs / live
  | 'souvenirs_premium'
  | 'livestream'
  // ia
  | 'ai_assistant'
  | 'ai_recommendations'
  // image de marque
  | 'premium_themes'
  | 'profile_halo'
  | 'public_badge'
  | 'ad_free'
  | 'priority_support';

export interface FeatureMeta {
  label: string;
  /** Plan minimum qui débloque la fonctionnalité. */
  requires: PlanTier;
  /** Description émotionnelle courte (pour upgrade modal). */
  benefit: string;
}

export const FEATURE_CATALOG: Record<FeatureId, FeatureMeta> = {
  event_pages: {
    label: 'Pages actives',
    requires: 'essentiel',
    benefit: 'Crée plusieurs pages pour célébrer chacun de tes proches.',
  },
  cover_video_custom: {
    label: 'Vidéo de couverture personnalisée',
    requires: 'essentiel',
    benefit: 'Ta propre vidéo HD en tête de page pour une émotion unique.',
  },
  album_photos_per_page: {
    label: 'Photos dans l’album',
    requires: 'essentiel',
    benefit: 'Ajoute plus de photos pour ne perdre aucun souvenir.',
  },
  album_export: {
    label: 'Export album souvenir',
    requires: 'essentiel',
    benefit: 'Télécharge ton album en PDF (et vidéo en Premium).',
  },
  active_funds: {
    label: 'Cagnottes actives',
    requires: 'essentiel',
    benefit: 'Crée plusieurs cagnottes en parallèle, sans limite en Premium.',
  },
  fund_commission_rate: {
    label: 'Commission cagnotte réduite',
    requires: 'essentiel',
    benefit: 'Commission réduite à 3 % (0 % en Premium).',
  },
  guests_per_page: {
    label: 'Invités par page',
    requires: 'essentiel',
    benefit: 'Invite plus de monde sans contrainte.',
  },
  rsvp_advanced: {
    label: 'RSVP avancé',
    requires: 'essentiel',
    benefit: 'Questions personnalisées, +1, régime alimentaire.',
  },
  plan_de_table: {
    label: 'Plan de table',
    requires: 'essentiel',
    benefit: 'Organise tes invités par tablée en quelques clics.',
  },
  expense_management: {
    label: 'Checklist, budget, tâches & prestataires',
    requires: 'essentiel',
    benefit: 'Toute la préparation au même endroit, sereinement.',
  },
  co_organizers: {
    label: 'Co-organisateurs',
    requires: 'essentiel',
    benefit: 'Partage la préparation avec tes proches.',
  },
  souvenirs_premium: {
    label: 'Capsules souvenirs & rétrospective',
    requires: 'premium',
    benefit: 'Replonge dans tes moments forts, année après année.',
  },
  livestream: {
    label: 'Livestream',
    requires: 'premium',
    benefit: 'Diffuse ton événement en direct pour les absents.',
  },
  ai_assistant: {
    label: 'Assistant IA conversationnel',
    requires: 'premium',
    benefit: 'Ton coach émotionnel IA, disponible sans limite.',
  },
  ai_recommendations: {
    label: 'Suggestions IA',
    requires: 'essentiel',
    benefit: 'Plus d’idées cadeaux et de messages générés par mois.',
  },
  premium_themes: {
    label: 'Thèmes émotionnels exclusifs',
    requires: 'premium',
    benefit: 'Des ambiances visuelles uniques pour tes pages.',
  },
  profile_halo: {
    label: 'Halo Premium sur ton profil',
    requires: 'premium',
    benefit: 'Une touche dorée qui célèbre ta générosité.',
  },
  public_badge: {
    label: 'Badge public',
    requires: 'essentiel',
    benefit: 'Affiche ton statut de membre engagé.',
  },
  ad_free: {
    label: 'Sans publicité ni filigrane',
    requires: 'premium',
    benefit: 'Une expérience 100 % émotionnelle, sans distraction.',
  },
  priority_support: {
    label: 'Support prioritaire',
    requires: 'essentiel',
    benefit: 'Réponse rapide par email (48 h) ou WhatsApp (24 h en Premium).',
  },
};

export const getFeatureMeta = (id: FeatureId): FeatureMeta => FEATURE_CATALOG[id];