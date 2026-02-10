

# Harmoniser l'affichage des etapes de progression sur mobile

## Probleme

Sur mobile, les etapes (Identite, Anniversaire, Email, Mot de passe, Validation) sont alignees horizontalement avec `flex justify-between`, ce qui provoque :
- Le texte "Mot de passe" qui passe sur 2 lignes
- Les elements comprimes et mal espaces
- Un rendu peu lisible et desordonne

Ce probleme affecte 3 composants :
1. `ClientSignupProgressIndicator` dans Auth.tsx (4 etapes)
2. `EmailSignupProgressIndicator` dans BusinessAuth.tsx (5 etapes)
3. `SignupProgressIndicator` dans BusinessAuth.tsx (phone, 4-5 etapes)

## Solution

Remplacer la ligne horizontale d'etapes par une **grille responsive** qui s'adapte au mobile :

- **Mobile** : `grid grid-cols-3` pour les indicateurs a 4-5 etapes, avec `text-center` pour chaque etape. Les etapes s'organisent sur 2 lignes (3+2 ou 2+2) au lieu d'une seule ligne comprimee.
- **Desktop** : `flex justify-between` conserve (via `md:flex md:justify-between`).

Chaque etape sera presentee en colonne (icone au-dessus, label en dessous) pour un rendu plus compact et lisible.

## Detail technique

### Modifications dans les 3 composants

Remplacer le conteneur des etapes :

**Avant** :
```
<div className="flex justify-between text-xs text-muted-foreground">
```

**Apres** :
```
<div className="grid grid-cols-3 gap-2 md:flex md:justify-between text-xs text-muted-foreground">
```

Et chaque etape individuelle passe de `flex items-center gap-1` a `flex flex-col items-center gap-0.5 text-center` pour empiler l'icone et le label verticalement sur mobile :

**Avant** :
```
<div className="flex items-center gap-1">
  <Check/> <span>Mot de passe</span>
</div>
```

**Apres** :
```
<div className="flex flex-col items-center gap-0.5 text-center">
  <Check/> <span>Mot de passe</span>
</div>
```

## Fichiers impactes

- **Modifie** : `src/pages/Auth.tsx` -- `ClientSignupProgressIndicator` (ligne 67)
- **Modifie** : `src/pages/BusinessAuth.tsx` -- `EmailSignupProgressIndicator` (ligne 135) et `SignupProgressIndicator` (si meme probleme)

