# Plan : Améliorer le modal "Ajouter un ami" et avertissement cercle d'amis

## Changements

### 1. Modal de partage séparé (`AddFriendModal.tsx`)

Quand l'utilisateur clique "Envoyer à un proche pour qu'il complète", au lieu d'afficher les réseaux sociaux en bas du même modal (actuellement lignes 287-328), ouvrir un **nouveau Dialog** dédié avec :

- Titre "Partager le lien"
- Grille 2 colonnes des boutons de partage (WhatsApp, Facebook, LinkedIn, Gmail, SMS, Email, Copier, Plus...) — style identique à la capture d'écran
- Le lien affiché proprement en bas dans un bloc `bg-muted rounded-lg` avec `break-all` et taille lisible
- Supprimer l'affichage inline actuel des réseaux (lignes 287-328)

### 2. Lien affiché harmonieusement

Dans le nouveau modal de partage, le lien sera dans un conteneur avec padding suffisant, `text-xs font-mono break-all` pour éviter tout débordement.

### 3. Avertissement rouge sous "Mon cercle d'amis" (`Dashboard.tsx`)

Sous le titre "Mon cercle d'amis" (ligne 684), ajouter un bloc d'avertissement :

- Texte en **rouge gras** : "Attention ! Ajoute les personnes que tu connais à ton cercle d'amis. Si elles ne te connaissent pas, elles pourraient hésiter à t'offrir des cadeaux."
- Bouton masquer/démasquer (icône œil) avec état local `useState`, **visible par défaut**
- Style compact pour ne pas prendre trop de place

## Fichiers modifiés

- `src/components/AddFriendModal.tsx` — extraire le partage dans un sous-Dialog, nettoyer l'affichage
- `src/pages/Dashboard.tsx` — ajouter l'avertissement rouge sous le titre cercle d'amis