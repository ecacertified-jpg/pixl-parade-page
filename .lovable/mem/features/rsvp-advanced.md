---
name: RSVP avancé
description: Champs régime/+1 noms/relances sur event_guests, page RSVP étendue, dashboard organisateur avec filtres et export CSV
type: feature
---
Colonnes ajoutées à `event_guests`: `dietary_preference text`, `plus_one_names text[]`, `reminder_sent_at timestamptz`, `reminder_count int default 0`.

RPCs:
- `get_rsvp_by_token(_token)` retourne maintenant dietary_preference + plus_one_names.
- `submit_rsvp_by_token(_token, _response, _plus_ones, _message, _dietary, _plus_one_names)` accepte les nouveaux champs.
- `mark_rsvp_reminder_sent(_guest_id)` (SECURITY DEFINER) : checks `can_manage_page(auth.uid(), pt, pid, 'guests')` puis incrémente reminder_count.

UI:
- `RsvpPage`: select régime (vegetarien/vegan/sans_porc/halal/sans_gluten/autre) + inputs dynamiques pour les prénoms des +1 (sync auto avec plusOnes).
- `GuestsList`: stats étendues (couverts = 1+plus_ones par yes), filtres par statut, bouton "Relancer (n)" qui ouvre WhatsApp en séquence (setTimeout 400ms) avec message dédié et incrémente reminder_count, export CSV (BOM UTF-8), badge "🔔 Relancé Nx", affichage régime + accompagnants.