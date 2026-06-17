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