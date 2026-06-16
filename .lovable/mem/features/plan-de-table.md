---
name: Plan de table
description: Sous-onglet "Mes coulisses" pour créer des tables, assigner les invités avec contrôle de capacité, export CSV
type: feature
---
Table `event_tables` polymorphique (page_type+page_id) : `name`, `capacity` (1–50), `shape` (round/rect/square), `position_x/y` réservés pour un futur drag&drop, `color`, `notes`. RLS via `can_manage_page` rôle 'guests'.

`event_guests` reçoit `table_id` (FK ON DELETE SET NULL) et `seat_number` (optionnel).

UI `SeatingPlan` (sous-onglet 🪑 dans `OrganizationSection`) :
- Stats : nb tables, places assignées/capacité totale, invités sans table.
- Ajout rapide (nom + capacité + forme).
- Liste de tables avec invités placés (bouton "Retirer").
- Section "À placer" avec un Select par invité pour assigner à une table (option désactivée si table complète).
- Export CSV (BOM UTF-8, séparateur `;`) listant chaque table avec ses invités.

Pas de drag&drop pour l'instant : volontairement simple, mobile-first. Les colonnes position_x/y existent pour évolution future.
