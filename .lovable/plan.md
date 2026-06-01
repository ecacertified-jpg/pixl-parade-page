# Artisans de la célébration

## Objectif
Permettre au fêté (ou organisateur) de citer les prestataires (organisateur, décorateur, pâtissier, photographe, vidéaste, DJ, maquilleuse, autre) qui contribuent à sa célébration. Étape **facultative**, intégrée à la création de page anniversaire **et** événement, avec affichage discret sur la page et le fil d'actualité, et architecture prête pour une future marketplace.

## 1. Base de données

Migration ajoutant une colonne JSONB `celebration_artisans` :

- `birthday_pages.celebration_artisans jsonb not null default '[]'::jsonb`
- `event_pages.celebration_artisans jsonb not null default '[]'::jsonb`

Format stocké (préparé pour la V2) :
```json
[
  { "role": "decorateur", "role_label": "Décorateur", "name": "Event Prestige" },
  { "role": "photographe", "role_label": "Photographe", "name": "Studio Flash" }
]
```
Les champs réservés futurs (`provider_id`, `phone`, `portfolio_url`, `rating`) ne sont pas créés maintenant mais le format objet permet de les ajouter sans migration.

Aucune nouvelle table de prestataires pour l'instant — on évite de surdimensionner. La table `service_providers` viendra avec la V2 marketplace.

## 2. Catalogue des rôles

Nouveau fichier `src/data/celebration-artisan-roles.ts` :
```text
organisateur 🎉, decorateur 🎈, patissier 🎂, photographe 📸,
videaste 🎥, animateur 🎤, maquilleuse 💄, autre 🎁
```
Chaque entrée : `{ key, label, emoji }`. Source unique pour modal + page + feed.

## 3. UI de saisie

Nouveau composant `src/components/birthday/CelebrationArtisansPicker.tsx` :
- Grille de chips sélectionnables (1 chip par rôle, emoji + label)
- Au clic, on affiche un champ texte `Nom du prestataire (facultatif)` sous la chip
- Boutons `Ignorer cette étape` (ferme sans modifier) et `Continuer` (persiste les saisies non vides)
- Mobile-first, style cartes douces existant (rounded-2xl, gradient secondary, pas de surcharge)

Intégration :
- **`BirthdayPageBuilderModal.tsx`** : nouvelle étape facultative `artisans`, insérée après `publish` (page créée donc `page.id` connu) et avant `share`. La checklist marque l'étape complétée si `celebration_artisans.length > 0` **ou** si l'utilisateur a cliqué `Ignorer` (flag local `bp_artisans_skipped_${pageId}` en localStorage pour ne pas la re-prompter). L'étape n'est jamais bloquante pour l'onboarding global (`useOnboarding` reste inchangé).
- **`CreateEventPage.tsx`** : même composant rendu en bas du formulaire, avant le bouton de soumission, pour les pages d'événement.

Persistance : `UPDATE birthday_pages SET celebration_artisans = ... WHERE id = ?` (ou `event_pages`).

## 4. Affichage sur la page

Nouveau composant `src/components/birthday/CelebrationArtisansSection.tsx` :
- Reçoit `artisans: Artisan[]`
- Ne rend **rien** si liste vide
- Titre : `Les artisans de cette célébration`
- Liste élégante (Card existante) : `{emoji} {role_label} : {name}` — masque la ligne si `name` vide
- Note discrète en bas : *"Bientôt : retrouvez et contactez ces professionnels."* (prépare la V2)

Insertion :
- `BirthdayPage.tsx` : entre `BirthdayCountdown` (≈ ligne 639) et le bloc `FundSelector` (≈ ligne 684)
- `EventPage.tsx` : même position relative (après header profil + countdown, avant cagnotte)

## 5. Affichage discret dans le fil d'actualité

Localiser la carte qui annonce une page d'anniversaire dans le feed (recherche `useNewsFeed` / cartes posts type `birthday_page`). Sous le titre `n {Nom}`, ajouter un petit texte muted :
- si `count === 0` → rien
- si `count >= 1` → `🎉 {count} artisan{s} participent à cette célébration`

Implémentation : étendre la query du feed pour sélectionner `celebration_artisans` sur la jointure birthday_pages/event_pages, puis ajouter un sous-titre conditionnel dans le composant de carte concerné. Aucune nouvelle requête supplémentaire (champ ajouté au `select` existant).

## 6. Types

Ajout d'un type partagé `src/types/celebrationArtisan.ts` :
```ts
export interface CelebrationArtisan {
  role: string;          // key (slug stable)
  role_label: string;    // libellé affiché
  name?: string;         // facultatif
  // V2 ready: provider_id?, phone?, portfolio_url?, rating?
}
```
Le fichier `src/integrations/supabase/types.ts` sera regénéré automatiquement après la migration.

## 7. Hors-périmètre (V2)
- Table dédiée `service_providers` + profils, portfolios, contact, évaluation, réservation
- Liens cliquables vers fiche prestataire dans la section et le feed
- Modération / vérification des prestataires

## Détails techniques

- Aucune modification des flux existants (cagnotte, album, messages, partage, onboarding bloquant)
- Pas de RLS supplémentaire — la colonne hérite des policies existantes de `birthday_pages` / `event_pages`
- Pas de changement de design system — réutilise tokens `secondary`, `primary`, `card`, `rounded-2xl`, `shadow-soft`, fonts Poppins/Nunito
- Mobile-first, accessible (chips = `button`, champ texte avec `label`, taille tactile ≥ 44px)
