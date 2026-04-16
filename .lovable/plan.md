

# Plan : Boutons d'action (réactions) sur les cartes du fil d'actualités

## Objectif

Remplacer le bouton "Voir la page" et la section stats par une barre de boutons-icônes de type réaction en bas de chaque carte du fil d'actualités. Ces boutons permettent aux utilisateurs d'interagir directement depuis le fil : téléverser des photos/vidéos, écrire un souvenir, contribuer à la cagnotte, et promettre un cadeau.

## Boutons d'action prévus

| Icône | Label | Action |
|-------|-------|--------|
| 📷 Camera | Photo | Ouvre le sélecteur de fichiers image, upload vers `birthday-page-photos` / `event-page-photos` |
| 🎥 Video | Vidéo | Ouvre le sélecteur de fichiers vidéo, upload vers le même bucket |
| ✍️ Quote | Souvenir | Affiche un champ texte inline pour écrire un souvenir |
| 💰 Gift | Cagnotte | Navigue vers la page de la cagnotte (`/f/:fundId`) si elle existe |
| 🎁 Gift | Cadeau | Navigue vers la page pour promettre un cadeau |
| 👁️ ArrowRight | Voir | Conserve la navigation vers la page complète |

## Fichiers concernés

| Fichier | Changement |
|---------|------------|
| `src/components/FeedCardActions.tsx` | **Nouveau** — Composant avec la barre de boutons-icônes d'action (upload photo/vidéo, souvenir texte, cagnotte, cadeau) |
| `src/components/PageFeedCard.tsx` | Remplacer la section stats + bouton CTA par `<FeedCardActions />`. Ajouter les refs input file et le state pour le formulaire souvenir inline |
| `src/hooks/usePagesFeed.ts` | Ajouter `fund_id` au type `FeedPage` pour pouvoir naviguer directement vers la cagnotte |

## Détails techniques

### `FeedCardActions.tsx`
- Barre horizontale de boutons-icônes arrondis (style similaire à `AlbumItemReactions`)
- Chaque bouton = icône + label court en dessous (ex: 📷 Photo)
- Style : `rounded-full bg-muted/60 hover:bg-primary/10` avec animation `framer-motion` au clic
- Boutons conditionnels :
  - **Cagnotte** : visible uniquement si `page.fund` existe
  - **Cadeau** : toujours visible
- Upload photo/vidéo : hidden `<input type="file">` déclenché par le clic, insertion dans `birthday_page_photos` ou `event_page_photos` selon `page.type`
- Souvenir : toggle un `<Textarea>` inline sous la barre avec bouton envoyer
- Auth requise : si non connecté, redirige vers `/auth?redirect=...`

### `PageFeedCard.tsx`
- Supprimer la section "Stats row" et le bouton "Voir la page"
- Intégrer `<FeedCardActions>` en bas de la carte
- Conserver un petit lien "Voir la page →" discret en bas
- Passer `page.id`, `page.type`, `page.slug`, `page.fund` comme props

### `usePagesFeed.ts`  
- Ajouter `fund_id: string | null` dans l'interface `FeedPage`
- Le mapper depuis les données existantes (`bp.fund_id`, `ep.fund_id`)

## Comportement attendu

1. L'utilisateur voit une rangée de boutons-icônes sous chaque carte
2. Cliquer sur 📷 ouvre le sélecteur d'images → upload → toast "Photo ajoutée !"
3. Cliquer sur 🎥 ouvre le sélecteur de vidéos → upload → toast "Vidéo ajoutée !"
4. Cliquer sur ✍️ affiche un champ texte inline → envoi → toast "Souvenir partagé !"
5. Cliquer sur 💰 navigue vers `/f/:fundId` (contribution directe)
6. Cliquer sur 🎁 navigue vers la page pour promettre un cadeau
7. Si l'utilisateur n'est pas connecté, redirection vers l'auth

