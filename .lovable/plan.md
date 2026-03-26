

# Plan : Afficher la wishlist dans le modal de cotisation groupée

## Problème

Quand l'utilisateur sélectionne un contact dans "Offrir à quelqu'un" (OrderModal), la liste de souhaits du contact s'affiche. Mais dans le modal "Cotisation groupée" (CollaborativeGiftModal), cette wishlist n'apparait pas.

## Changement — `src/components/CollaborativeGiftModal.tsx`

### Ajouter la ContactWishlistSection après la sélection du contact

Quand un contact est sélectionné (`selectedContact` non null), afficher `<ContactWishlistSection>` entre la liste des contacts et le bouton "Démarrer une cotisation" :

- Importer `ContactWishlistSection` et `ContactWishlistItem`
- Insérer le composant après le bloc `ExistingFundsAlert` (ligne 302) et avant le bloc `showCreateButton` (ligne 305)
- Props : `contactId={selectedContact.id}`, `contactName={selectedContact.name}`, `compact`
- `onSelectProduct` : quand l'utilisateur clique sur "Offrir" d'un souhait, remplacer le produit courant par celui de la wishlist et lancer la cotisation pour ce produit

### Comportement du callback onSelectProduct

Quand l'utilisateur clique sur un article de la wishlist :
- Ajouter cet article au panier en mode `isCollaborativeGift` avec le contact comme bénéficiaire
- Naviguer vers `/cart`
- Fermer le modal

## Fichier modifié

- `src/components/CollaborativeGiftModal.tsx`

