
## Objectif

Faire apparaître correctement la page d’anniversaire d’Amtey dans le fil d’actualités de `/home`, et garantir qu’une page nouvellement créée remonte automatiquement dans le feed.

## Constat vérifié

- La capture montre l’onglet **Tous** vide, alors qu’il ne devrait pas l’être.
- En base, il y a bien des données :
  - **160 birthday_pages actives**
  - **0 event_pages actives** actuellement
  - La page d’Amtey existe bien, est active, avec :
    - **8 photos**
    - **1 cagnotte active**
    - slug `user-b348bb92-2026`
- Donc le problème n’est pas l’absence de données, mais **le chargement du feed côté front**.

## Cause probable

Le hook `usePagesFeed` essaie d’embarquer les profils avec :

```ts
profiles!birthday_pages_user_id_fkey (...)
profiles!event_pages_creator_id_fkey (...)
```

Or, dans le typage Supabase actuel, `birthday_pages` et `event_pages` n’exposent pas de relation vers `profiles`, seulement vers `collective_funds`.

Conséquence probable :
- la requête Supabase/PostgREST du feed échoue,
- le `catch` est déclenché,
- `pages` reste vide,
- l’UI affiche à tort “Aucun album souvenir pour le moment”.

## Plan de correction

### 1. Rendre `usePagesFeed` robuste
Remplacer la requête “tout-en-un” par un chargement en 2 temps :

1. Charger `birthday_pages` et `event_pages` avec :
   - photos
   - cagnotte
   - infos de base de la page
2. Extraire les `user_id` / `creator_id`
3. Charger les profils dans une requête séparée sur `profiles`
4. Faire l’assemblage côté front avec fallback si un profil est masqué/incomplet

Cela supprimera la dépendance à une relation embarquée fragile/invalide.

### 2. Conserver la logique sociale existante
Garder :
- l’onglet **Tous**
- l’onglet **Abonnements**
- le croisement entre :
  - `user_follows` pour les proches/amis
  - `page_follows` pour les abonnements explicites à une page

### 3. Garantir l’affichage immédiat après création
Après validation de “Créer ma page” dans `OnboardingExperience` :
- déclencher un événement global de refresh du feed, ou
- invalider/recharger explicitement le feed

Ainsi, si l’utilisateur revient sur `/home` ou si le feed est déjà monté, sa page apparaîtra sans comportement ambigu.

### 4. Préserver la mise en avant de la page de l’utilisateur
Conserver le tri actuel :
1. **Ma page**
2. pages avec contenu (album/couverture/cagnotte)
3. plus récentes

Ainsi la nouvelle page reste visible en haut.

## Fichiers concernés

| Fichier | Changement |
|---|---|
| `src/hooks/usePagesFeed.ts` | Refaire le chargement des pages + profils en requêtes séparées |
| `src/components/OnboardingExperience.tsx` | Déclencher un refresh du fil après création réussie |
| `src/components/NewsFeed.tsx` | Écouter le refresh si nécessaire, sans changer l’UI |
| `src/components/PageFeedCard.tsx` | Pas de refonte majeure, seulement ajustements si fallback profil nécessaire |

## Détails techniques

- Ne plus utiliser :
  - `profiles!birthday_pages_user_id_fkey`
  - `profiles!event_pages_creator_id_fkey`
- À la place :
  - `birthday_pages` / `event_pages` + relations valides (`birthday_page_photos`, `event_page_photos`, `collective_funds`)
  - puis `profiles` via `.in('user_id', creatorIds)`
- Si un profil n’est pas lisible via RLS :
  - garder la page visible
  - afficher un nom de secours (`Utilisateur`) et avatar fallback
- Le feed ne doit jamais devenir vide juste parce qu’une jointure profil échoue.

## Résultat attendu

Après implémentation :
- Amtey verra sa page dans le fil de `/home`
- l’onglet **Tous** ne sera plus vide alors que des pages existent
- les pages créées juste après onboarding apparaîtront automatiquement
- les abonnements et le filtre **Abonnements** continueront de fonctionner
