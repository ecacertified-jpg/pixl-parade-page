import type { ExportColumn } from '@/utils/exportUtils';
import type { SegmentAuditRow } from '@/hooks/useJdvCrm';

const NA = 'Non disponible';
const orNA = (v: any) => (v === null || v === undefined || v === '' ? NA : String(v));
const list = (v: any) => (Array.isArray(v) && v.length ? v.join(' | ') : NA);

export const CRM_AUDIT_COLUMNS: ExportColumn<SegmentAuditRow>[] = [
  { key: 'crm_id', header: 'CRM ID', format: orNA },
  { key: 'user_id', header: 'User ID JDV' },
  { key: 'nom', header: 'Utilisateur' },
  { key: 'segment_actuel', header: 'Segment actuel' },
  { key: 'segment_actuel_label', header: 'Libellé du segment actuel' },
  { key: 'conditions_label', header: 'Conditions détectées' },
  { key: 'regles_declenchees', header: 'Règles déclenchées', format: list },
  { key: 'segment_attendu', header: 'Segment attendu' },
  { key: 'segment_attendu_label', header: 'Libellé du segment attendu' },
  { key: 'ecart', header: 'Écart', format: (v) => (v ? 'Oui' : 'Non') },
  { key: 'type_anomalie', header: 'Type d’anomalie' },
  { key: 'action_recommandee', header: 'Action recommandée' },
];
