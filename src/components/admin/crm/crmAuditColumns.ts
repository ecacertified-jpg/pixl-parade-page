import type { ExportColumn } from '@/utils/exportUtils';
import type { SegmentAuditRow } from '@/hooks/useJdvCrm';

const NA = 'Non disponible';
const orNA = (v: any) => (v === null || v === undefined || v === '' ? NA : String(v));
const list = (v: any) => (Array.isArray(v) && v.length ? v.join(' | ') : NA);

export const CRM_AUDIT_COLUMNS: ExportColumn<SegmentAuditRow>[] = [
  { key: 'crm_id', header: 'IDENTITÉ — CRM ID', format: orNA },
  { key: 'user_id', header: 'IDENTITÉ — User ID JDV' },
  { key: 'nom', header: 'IDENTITÉ — Utilisateur', format: orNA },
  { key: 'segment_actuel', header: 'SEGMENTATION — Segment actuel (code)', format: orNA },
  { key: 'segment_actuel_label', header: 'SEGMENTATION — Segment actuel (libellé)', format: orNA },
  { key: 'conditions_label', header: 'AUDIT — Conditions détectées', format: orNA },
  { key: 'regles_declenchees', header: 'AUDIT — Règles déclenchées', format: list },
  { key: 'segment_attendu', header: 'AUDIT — Segment attendu (code)', format: orNA },
  { key: 'segment_attendu_label', header: 'AUDIT — Segment attendu (libellé)', format: orNA },
  { key: 'ecart', header: 'AUDIT — Écart (Oui/Non)', format: (v) => (v ? 'Oui' : 'Non') },
  { key: 'type_anomalie', header: 'AUDIT — Type d’anomalie', format: orNA },
  { key: 'action_recommandee', header: 'AUDIT — Action recommandée', format: orNA },
];
