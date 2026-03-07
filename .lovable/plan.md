## Modification de la Landing Page — Texte hero et CTA anniversaire

### Changement

Dans `src/pages/Landing.tsx` (lignes 92-100), remplacer :

1. **Le paragraphe** (ligne 92-94) par le nouveau texte :
  > "Combien de personnes se souviennent de votre date d'anniversaire chaque année ? Êtes-vous sûr(e) de recevoir un cadeau à votre anniversaire ? Enregistrez votre date d'anniversaire pour que vos proches ne vous oublient pas désormais !"
2. **Le premier bouton** "Commencer gratuitement" (ligne 96-99) → **"Enregistrer son anniversaire"** avec icône `Calendar` au lieu de `Sparkles`, pointant vers `/auth?tab=signup` (même destination).

### Fichier modifié


| Fichier                 | Lignes | Action                                             |
| ----------------------- | ------ | -------------------------------------------------- |
| `src/pages/Landing.tsx` | 92-99  | Remplacer texte paragraphe + label/icône du bouton |


Un seul fichier, modification minimale.