---
name: Souvenirs module
description: Hub /souvenirs agrégeant photos/vidéos des birthday_pages et event_pages, avec timeline émotionnelle, capsules temporelles (Premium) et rétrospective annuelle (Premium)
type: feature
---

- Route `/souvenirs` (alias `/memories`), protégée.
- Source unique: agrégation `birthday_page_photos` + `event_page_photos` via `useAggregatedMemories`. Aucune table dédiée pour les photos.
- Émotion auto-déduite depuis `occasion` via `src/data/memory-emotions.ts` (mapping statique, pas d'IA).
- 3 onglets: Galerie (grille 3 cols), Albums (cards par page), Timeline (vue chronologique par mois + filtres émotion).
- Table `memory_capsules` (Premium): scellée avec `unlock_date`. RLS: owner full access; recipients voient la ligne uniquement si `is_unlocked = true AND recipients ? auth.uid()::text`.
- Cron quotidien `unlock-memory-capsules-daily` (6h UTC) appelle l'edge function du même nom, qui marque les capsules dues unlocked et crée des notifications in-app.
- Rétrospective `/souvenirs/retrospective/:year`: format Wrapped stories (Premium). Affichée pour `currentYear` à partir du 1er décembre, sinon `currentYear - 1`.
- Premium gating via `usePlan().isAtLeast('premium' | 'essentiel')`. Non-premium → redirige vers `/pricing`.
- Hors scope v1: upload manuel de souvenirs, souvenirs familiaux privés dédiés, génération PDF du livre souvenir (bucket Storage et edge function à ajouter v2).

## v2 additions
- **Coffre familial privé** : table `family_vault_shares` (owner_user_id, memory_source, memory_id). RLS owner full access; lecture par membres dont `contacts.linked_user_id = auth.uid()` dans un cercle nommé « Famille » (`friend_circles.name ILIKE 'famille'|'family'`). Réutilise les cercles existants — pas de nouvelle entité famille. Bouton « partager » dans `MemoriesGallery`.
- **Livre souvenir PDF** : table `souvenir_books` (user_id, year unique). Edge function `generate-souvenir-book` (verify_jwt=true par défaut) utilise pdf-lib (esm.sh) pour générer un PDF A4 (cover + 1 page par photo, max 50) à partir de `birthday_page_photos` + `event_page_photos` filtrés par année. Stocké dans bucket privé `souvenir-books` (créé à la volée par l'edge function si absent) sous `{user_id}/livre-{year}.pdf`. URL signée 1 an renvoyée et stockée dans `pdf_url`. Premium uniquement (gating UI via `usePlan().isAtLeast('premium')`).
- **Archivage cloud** : QuotaBar `storage_mb` ajoutée à la page Souvenirs. Limites par plan inchangées (Free 500 Mo / Essentiel 5 Go / Premium 50 Go).
- **Souvenirs automatiques** : edge functions existantes `notify-on-this-day`, `notify-weekly-memories`, `notify-new-memory` couvrent les notifs auto — non modifiées.