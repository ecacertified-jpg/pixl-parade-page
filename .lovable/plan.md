# Plan : Bouton "Crée ma page d'anniversaire" ostentatoire dans le Dashboard

## Contexte

Apres l'onboarding, l'utilisateur a complete sa wishlist (≥3 articles) et ajoute des amis (≥3). Il faut maintenant l'inciter a creer/partager sa page d'anniversaire avec un CTA tres visible et anime, place dans le dashboard principal (avant les onglets).

## Conditions d'affichage

Le bouton s'affiche **uniquement** quand :

1. `stats.total >= 3` (wishlist complete — via `useFavorites`)
2. `friends.length >= 3` (au moins 3 ami)
3. `!hasSharedBirthday` (n'a pas encore partage sa page)
4. `birthdayPageSlug` existe (page auto-creee)

## Emplacement

Dans `Dashboard.tsx`, **entre la section "Liste de souhaits" (`FavoriteArticlesSection`) et les cartes de badges** (ligne ~653), pour une visibilite maximale dans le flux naturel du dashboard.

## Composant

Un nouveau composant `CreateBirthdayPageCTA` inline dans Dashboard.tsx (ou separe) :

```text
┌────────────────────────────────────────────┐
│  🎂                                        │
│  Ta page d'anniversaire t'attend !         │
│                                            │
│  Tu as tes amis et ta liste de souhaits.   │
│  Il ne reste plus qu'à créer ta page       │
│  d'anniversaire pour que tes proches       │
│  puissent te gâter ! 🎁                    │
│                                            │
│  [🎂 Créer ma page d'anniversaire]         │
│  (bouton animé, pulsant, gradient violet)  │
└────────────────────────────────────────────┘
```

### Style du bouton

- Gradient `bg-gradient-to-r from-primary via-accent to-secondary`
- `animate-bounce` + `shadow-lg shadow-primary/40`
- Taille large, texte bold, icone Cake
- Bordure lumineuse `ring-2 ring-primary/30`

### Message incitatif

- Titre : "Ta page d'anniversaire t'attend ! 🎂"
- Description : "Tu as tes amis et ta liste de souhaits. Crée maintenant ta page d'anniversaire pour que tes proches puissent te gâter, t'écrire des mots doux et participer à ta cagnotte !"

### Action du bouton

- Clic → `navigate('/birthday/${birthdayPageSlug}')` pour ouvrir la page d'anniversaire existante (auto-creee)
- Puis l'utilisateur peut la partager depuis la page elle-meme

### Apres partage

- Une fois `hasSharedBirthday === true`, le CTA disparait definitivement

## Fichier concerne


| Fichier                   | Action                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/Dashboard.tsx` | Ajouter le bloc CTA anime entre FavoriteArticlesSection et les cartes de badges, conditionne par wishlist ≥ 3 + friends ≥ 3 + !hasSharedBirthday |
