

# Plan : Adapter le panier pour les commandes collectives (cagnottes)

## Problème

Quand un article est ajouté depuis la wishlist en mode cagnotte (`isCollaborativeGift: true`), le panier affiche "Passer commande individuelle" au lieu de "Lancer ma cagnotte" ou équivalent. L'utilisateur est confus car il crée une cagnotte pour ses amis, pas une commande individuelle.

## Solution

Adapter dynamiquement le bouton et le résumé du panier selon le type d'articles :

### Fichier : `src/pages/Cart.tsx`

1. **Détecter le mode collectif** : `const hasCollaborativeGifts = cartItems.some(item => item.isCollaborativeGift);`

2. **Bouton principal** : 
   - Si collectif → `🎁 Lancer ma cagnotte - {total} F` (avec style violet/primary au lieu d'orange)
   - Sinon → `🛒 Passer commande individuelle - {total} F` (actuel)

3. **Résumé de commande adapté** :
   - Si collectif → afficher "Objectif de la cagnotte" au lieu de "Sous-total", masquer les frais de livraison (la livraison sera gérée après la collecte), et afficher "Montant à collecter" au lieu de "Total"
   - Ajouter un texte explicatif : "Vos amis contribueront selon leurs moyens pour atteindre cet objectif"

4. **Masquer la barre de livraison gratuite** pour les commandes collectives (pas pertinent à ce stade)

