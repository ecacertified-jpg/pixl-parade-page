---
name: Réservation prestataires JDV
description: Lier un prestataire du marketplace JDV à un événement avec workflow de réservation (devis, acompte, statut)
type: feature
---
Colonnes ajoutées à `event_vendors` :
- `booking_status` : proposed | contacted | confirmed | cancelled (defaut proposed)
- `quote_amount`, `deposit_amount`, `currency` (XOF par défaut)
- `deposit_paid_at`, `contact_logged_at`, `requested_date`
- `business_account_id` (déjà existant) lie au business du marketplace

UI `VendorsList` enrichi :
- Bouton "Réserver via JDV" → `BrowseJDVModal` qui cherche dans `business_accounts` (is_active + status=active), liste 30 résultats avec logo/nom/ville.
- Sélection → crée un `event_vendors` avec `business_account_id`, status proposed, sans téléphone (vendor support mask : on ne dévoile jamais le téléphone du prestataire).
- Bouton "Contacter JDV" sur les vendors JDV : ouvre WhatsApp générique avec message pré-rempli et passe automatiquement le statut à `contacted`.
- Select de statut + inputs devis/acompte inline (Devis et Acompte en XOF). Renseigner l'acompte enregistre `deposit_paid_at`.
- Badge JDV + badge statut coloré (proposed/contacted/confirmed/cancelled).

Conformité : respecte la règle "Vendor support mask" — le téléphone du vendor JDV n'est jamais exposé à l'organisateur, la communication passe par JDV support.
