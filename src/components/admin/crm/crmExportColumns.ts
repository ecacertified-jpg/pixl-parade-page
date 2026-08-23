import type { ExportColumn } from '@/utils/exportUtils';
import type { CrmRecord } from '@/hooks/useJdvCrm';

const NA = 'Non disponible';
const yesNo = (v: any) => (v ? 'Oui' : 'Non');
const orNA = (v: any) => (v === null || v === undefined || v === '' ? NA : String(v));
const num = (v: any) => (v === null || v === undefined || v === '' ? '0' : String(v));
const dateFr = (v: any) => (v ? new Date(v).toLocaleDateString('fr-FR') : NA);
const list = (v: any) => (Array.isArray(v) && v.length ? v.join(' | ') : NA);

export const CRM_EXPORT_COLUMNS: ExportColumn<CrmRecord>[] = [
  // IDENTITÉ
  { key: 'crm_id', header: 'IDENTITÉ — CRM ID', format: orNA },
  { key: 'user_id', header: 'IDENTITÉ — User ID JDV' },
  { key: 'first_name', header: 'IDENTITÉ — Prénom', format: orNA },
  { key: 'last_name', header: 'IDENTITÉ — Nom', format: orNA },
  { key: 'phone', header: 'IDENTITÉ — Téléphone', format: orNA },
  { key: 'email', header: 'IDENTITÉ — Email', format: orNA },
  { key: 'signup_date', header: "IDENTITÉ — Date d'inscription", format: dateFr },
  { key: 'account_active', header: 'IDENTITÉ — Compte actif (Oui/Non)', format: yesNo },

  // LOCALISATION
  { key: 'country_code', header: 'LOCALISATION — Pays (code)', format: orNA },
  { key: 'city', header: 'LOCALISATION — Ville', format: orNA },

  // ANNIVERSAIRE
  { key: 'birthday', header: "ANNIVERSAIRE — Date d'anniversaire", format: (v) => (v ? dateFr(v) : 'Date inconnue') },
  { key: 'next_birthday', header: 'ANNIVERSAIRE — Prochain anniversaire', format: (v) => (v ? dateFr(v) : 'Date inconnue') },
  { key: 'days_to_birthday', header: 'ANNIVERSAIRE — Jours avant anniversaire', format: orNA },

  // PAGE
  { key: 'has_birthday_page', header: 'PAGE — Page anniversaire créée (Oui/Non)', format: yesNo },
  { key: 'has_event_page', header: 'PAGE — Page événement créée (Oui/Non)', format: yesNo },
  { key: 'event_page_occasion', header: "PAGE — Type d'événement", format: orNA },
  { key: 'birthday_page_created_at', header: 'PAGE — Date de création de la page', format: dateFr },
  { key: 'page_status', header: 'PAGE — Statut de la page', format: orNA },
  { key: 'page_published', header: 'PAGE — Page publiée (Oui/Non)', format: yesNo },
  { key: 'page_views', header: 'PAGE — Vues de la page', format: num },
  { key: 'page_url', header: 'PAGE — URL de la page', format: orNA },

  // CAGNOTTE
  { key: 'has_fund', header: 'CAGNOTTE — Cagnotte créée (Oui/Non)', format: yesNo },
  { key: 'fund_active', header: 'CAGNOTTE — Cagnotte active (Oui/Non)', format: yesNo },
  { key: 'first_fund_created_at', header: 'CAGNOTTE — Date de création de la cagnotte', format: dateFr },
  { key: 'funds_count', header: 'CAGNOTTE — Nombre de cagnottes', format: num },
  { key: 'contributions_count', header: 'CAGNOTTE — Nombre de contributions', format: num },
  { key: 'total_collected', header: 'CAGNOTTE — Montant collecté (XOF)', format: num },

  // PARTAGE
  { key: 'has_shared', header: 'PARTAGE — Page partagée (Oui/Non)', format: yesNo },
  { key: 'last_share_at', header: 'PARTAGE — Dernier partage', format: dateFr },
  { key: 'shares_count', header: 'PARTAGE — Nombre de partages', format: num },
  { key: 'share_channels', header: 'PARTAGE — Canaux de partage', format: list },
  { key: 'messages_received', header: 'PARTAGE — Messages reçus', format: num },

  // ACTIVITÉ
  { key: 'niveau_activite', header: 'ACTIVITÉ — Niveau d’activité', format: orNA },
  { key: 'date_derniere_activite', header: 'ACTIVITÉ — Dernière activité réelle', format: dateFr },
  { key: 'jours_depuis_derniere_activite', header: 'ACTIVITÉ — Jours depuis la dernière activité réelle', format: orNA },
  { key: 'date_derniere_connexion', header: 'ACTIVITÉ — Dernière connexion (auth)', format: dateFr },
  { key: 'last_sign_in_at', header: 'ACTIVITÉ — Dernière connexion (brut)', format: dateFr },
  { key: 'last_activity_at', header: 'ACTIVITÉ — Dernière activité (brut)', format: dateFr },
  { key: 'days_since_activity', header: 'ACTIVITÉ — Jours depuis dernière activité (brut)', format: orNA },
  { key: 'sessions_count', header: 'ACTIVITÉ — Nombre de sessions', format: num },

  // SEGMENTATION
  { key: 'segment', header: 'SEGMENTATION — Segment (code)', format: orNA },
  { key: 'segment_label', header: 'SEGMENTATION — Segment (libellé)', format: orNA },
  { key: 'etape_parcours', header: 'SEGMENTATION — Étape du parcours', format: orNA },
  { key: 'blocage_principal', header: 'SEGMENTATION — Blocage principal', format: orNA },
  { key: 'priority', header: 'SEGMENTATION — Priorité', format: orNA },
  { key: 'priority_reasons', header: 'SEGMENTATION — Justification de la priorité', format: list },

  // SCORE
  { key: 'score', header: 'SCORE — Score de réactivation (0-100)', format: num },
  {
    key: 'score_details',
    header: 'SCORE — Détail du score',
    format: (v: any) =>
      Array.isArray(v) && v.length
        ? v.map((d: any) => `${d.label} (${d.points > 0 ? '+' : ''}${d.points})`).join(' | ')
        : NA,
  },

  // SUIVI
  { key: 'next_action', header: 'SUIVI — Prochaine action recommandée', format: orNA },
  { key: 'statut_reactivation', header: 'SUIVI — Statut de réactivation', format: orNA },
  { key: 'statut_doublon', header: 'SUIVI — Statut de doublon', format: orNA },
  { key: 'last_contacted_at', header: 'SUIVI — Dernier contact', format: dateFr },
  { key: 'admin_notes', header: 'SUIVI — Notes admin', format: orNA },
];
