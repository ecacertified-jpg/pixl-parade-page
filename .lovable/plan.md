

# Plan : Textes hero + preuve sociale dynamique sur la Landing Page

## Changements de texte (fichier `src/pages/Landing.tsx`)

1. **Titre** (ligne 115-118) : remplacer "Célébrez les Moments de Bonheur" par "Vos proches oublient votre anniversaire ?"
2. **Sous-titre** (ligne 119-121) : remplacer le paragraphe actuel par "Inscrivez votre date et recevez enfin les cadeaux que vous aimez"
3. **Bouton** (ligne 124) : remplacer "Enregistrer son anniversaire" par "Créer mon anniversaire"

## Preuve sociale dynamique

Ajouter juste **sous le bouton CTA** (après la div des boutons, ligne ~130) un badge de preuve sociale :

- Texte : "Déjà **X** anniversaires créés sur Joie de Vivre"
- `X` = nombre total de contacts dans la table `contacts` (chaque contact représente un anniversaire enregistré)
- Requête Supabase : `supabase.from('contacts').select('*', { count: 'exact', head: true })` — pas de filtre d'authentification nécessaire car c'est un count public
- Formatage du nombre avec `toLocaleString('fr-FR')` pour les séparateurs de milliers
- Icône `Users` ou `Sparkles` + style discret (texte muted, taille sm)
- Le count est récupéré via un `useState`/`useEffect` directement dans le composant Landing (pas besoin de hook séparé, c'est une seule requête)

## Fichier modifié

- `src/pages/Landing.tsx` uniquement

