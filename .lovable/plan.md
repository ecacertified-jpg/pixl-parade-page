

# Plan : Afficher le lien de la page d'anniversaire dans l'onglet Cercle d'amis

## Resume

Ajouter une banniere dans l'onglet "amis" du Dashboard qui affiche le lien de la page d'anniversaire de l'utilisateur tant qu'il ne l'a pas encore partagee. La banniere disparait une fois le partage effectue.

## Solution

### 1. Ajouter un state et un fetch dans Dashboard.tsx

- Ajouter un state `birthdayPageSlug` et `hasSharedBirthday`
- Au mount, interroger `birthday_pages` pour le slug de l'utilisateur courant (annee en cours)
- Verifier si au moins un partage a ete effectue (on peut utiliser un flag local `localStorage` car il n'y a pas de table de suivi des partages, ou verifier si le `ShareBirthdayToCirclesModal` a ete utilise)

### 2. Banniere dans l'onglet "amis" (entre le titre et les chips)

Afficher une carte CTA avec :
- Icone gateau + texte "Partagez votre page d'anniversaire avec vos amis !"
- Le lien cliquable/copiable `/birthday/{slug}`
- Bouton "Partager a mes cercles" qui ouvre `ShareBirthdayToCirclesModal`
- Bouton "Copier le lien"
- La banniere se masque apres un partage reussi (via `localStorage` flag)

### 3. Importer et rendre ShareBirthdayToCirclesModal

- Ajouter un state `showShareBirthdayModal`
- Rendre le modal dans le JSX du Dashboard
- Quand le modal est ferme apres partage, setter le flag localStorage

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/Dashboard.tsx` | Fetch birthday slug, afficher banniere CTA dans onglet amis, integrer ShareBirthdayToCirclesModal |

## Comportement

```text
Onglet "Cercle d'amis"
┌──────────────────────────────────┐
│ 🎂 Partagez votre page !        │
│ joiedevivre.../birthday/slug     │
│ [📋 Copier] [🎉 Partager]       │
└──────────────────────────────────┘
│ Mon cercle d'amis    [+ Ajouter] │
│ [Tous] [Famille] [Amis] [+]     │
│ ...                              │
```

La banniere disparait quand l'utilisateur a partage au moins une fois (stocke en localStorage sous `birthday_shared_{userId}`).

