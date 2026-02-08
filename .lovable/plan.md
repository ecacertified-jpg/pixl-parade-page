

# Nuance de couleurs pour la page BusinessAuth

## Objectif

Ajouter une teinte de couleur distincte a la page BusinessAuth pour la differencier visuellement de la page Auth client, tout en gardant la meme structure.

## Proposition de palette

Utiliser une nuance **bleu-indigo professionnel** pour l'espace Business, en contraste avec le violet/rose de l'espace client :

| Element | Auth Client | BusinessAuth |
|---------|-------------|--------------|
| Fond de page | Violet lavande (bg-background) | Gradient subtil bleu-indigo |
| Badge "Espace Business" | Texte primary violet | Badge avec fond indigo/bleu fonce |
| Bordure Card | Defaut | Bordure superieure coloree indigo |
| Bouton Google | Style par defaut | Identique (coherence) |
| TabsList | Style par defaut | Teinte bleu-indigo subtile |

## Modifications prevues

### Fichier : `src/pages/BusinessAuth.tsx`

#### 1. Fond de page distinct
Ajouter un gradient de fond subtil bleu-indigo au conteneur principal :
- Classe : `bg-gradient-to-b from-slate-50 via-indigo-50/30 to-background dark:from-slate-950 dark:via-indigo-950/20 dark:to-background`

#### 2. Badge "Espace Business" plus visible
Transformer le badge actuel (texte simple) en un vrai badge avec fond colore :
- Fond : `bg-indigo-100 dark:bg-indigo-900/40`
- Texte : `text-indigo-700 dark:text-indigo-300`
- Icone Store en indigo
- Bordure arrondie, padding

#### 3. Bordure superieure coloree sur la Card
Ajouter une bordure superieure de 3-4px en indigo sur la Card pour donner un accent visuel immediat :
- `border-t-4 border-t-indigo-500`

#### 4. Bouton "Espace Client" style
Ajouter une teinte indigo legere au bouton retour :
- `text-indigo-600 hover:text-indigo-800`

### Resultat visuel attendu

```text
  [fond subtil bleu-indigo]
  ┌──────────────────────────┐
  │▓▓▓▓ bordure indigo ▓▓▓▓▓│
  │                          │
  │     Joie de Vivre        │
  │  [Espace Business]       │  <-- badge indigo
  │  Connectez-vous ou...    │
  │  <- Espace Client        │
  │                          │
  │  [Connexion] [Inscription]│
  │  ...                     │
  └──────────────────────────┘
```

## Fichier modifie
- `src/pages/BusinessAuth.tsx` uniquement (styles inline/Tailwind, pas de CSS global)

