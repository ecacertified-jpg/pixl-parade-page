

# Inventaire Boutique avec Liste de Souhaits et Integration dans les Modaux de Commande

## Contexte actuel

Le systeme de favoris existe deja avec :
- Table `user_favorites` (product_id, priority_level, occasion_type, accept_alternatives, context_usage, notes)
- Hook `useFavorites` pour ajouter/supprimer/configurer les favoris
- Page `/favorites` pour gerer sa propre liste de souhaits
- Bouton coeur `AnimatedFavoriteButton` utilise dans Shop, VendorShop, CategoryPage
- Politique RLS "Friends can view favorites" via `contact_relationships` -- les proches peuvent deja lire les favoris

**Ce qui manque** : quand un proche veut offrir un cadeau (via `OrderModal`), il ne voit **pas** la liste de souhaits du destinataire. Il n'y a pas non plus de page "inventaire" dediee pour parcourir tous les articles et cocher ses souhaits.

---

## Plan d'implementation

### 1. Nouvelle page "Inventaire / Catalogue de souhaits" (`/wishlist-catalog`)

Une page dediee ou l'utilisateur parcourt **tous les produits actifs** des boutiques avec la possibilite de cocher/decocher le coeur sur chaque article. C'est un catalogue simplifie axe sur la constitution de la wishlist.

**Contenu de la page** :
- Barre de recherche et filtres par categorie
- Grille de produits avec image, nom, prix, boutique
- Icone coeur sur chaque carte (toggle favori)
- Badge indiquant le nombre de souhaits selectionnes
- Lien rapide vers `/favorites` pour ajuster les parametres (priorite, occasion, notes)

**Fichier** : `src/pages/WishlistCatalog.tsx`

---

### 2. Hook pour charger la wishlist d'un contact (`useContactWishlist`)

Un hook qui recupere les favoris d'un utilisateur lie a un contact, en exploitant la politique RLS existante "Friends can view favorites".

**Logique** :
1. A partir du `contact_id`, chercher si ce contact a un `linked_user_id` dans la table `contacts`
2. Si oui, charger les `user_favorites` de ce `linked_user_id` (la politique RLS autorise deja cette lecture via `contact_relationships`)
3. Retourner les produits avec leurs parametres (priorite, occasion, notes, accept_alternatives)

**Fichier** : `src/hooks/useContactWishlist.ts`

---

### 3. Composant "Liste de souhaits du destinataire" dans OrderModal

Quand un utilisateur choisit "Offrir a quelqu'un" dans le `OrderModal` et selectionne un contact, on affiche un **onglet/section supplementaire** montrant la wishlist de ce contact.

**Modifications** : `src/components/OrderModal.tsx`

**Comportement** :
- Apres selection d'un contact, afficher une section "Ses souhaits" avec les articles de la wishlist
- Chaque article affiche : image, nom, prix, priorite (badge colore), occasion, et si des alternatives sont acceptees
- Bouton "Offrir cet article" pour ajouter directement au panier
- Si le contact n'a pas de compte lie ou pas de wishlist, afficher un message encourageant

---

### 4. Composant `ContactWishlistSection`

Un composant reutilisable affichant la wishlist d'un contact, utilisable dans :
- Le `OrderModal` (section integree)
- La page `GiftIdeas` (section dediee)

**Fichier** : `src/components/ContactWishlistSection.tsx`

**Affichage par article** :
- Image du produit
- Nom et prix
- Badge de priorite (Urgent/Prioritaire/Moyen/Faible)
- Badge d'occasion (Anniversaire, Mariage, etc.)
- Indicateur "Alternatives acceptees"
- Notes du destinataire (si presentes, ex: "Taille M, couleur bleue")
- Bouton "Offrir" / "Ajouter au panier"

---

### 5. Integration dans la page GiftIdeas

Ajouter la section `ContactWishlistSection` dans la page `/gift-ideas/:contactId` pour que les utilisateurs voient les souhaits de leur contact en contexte.

**Modification** : `src/pages/GiftIdeas.tsx`

---

### 6. Lien d'acces depuis le Dashboard et le menu

Ajouter un acces rapide vers `/wishlist-catalog` depuis :
- Le Dashboard (carte "Ma Liste de Souhaits")
- La page Favorites (lien "Parcourir le catalogue")

---

## Flux utilisateur

```text
UTILISATEUR A (constitue sa wishlist)
    |
    v
/wishlist-catalog --> Parcourt les articles --> Clique coeur
    |
    v
/favorites --> Ajuste priorite, occasion, notes, alternatives
    |
    v
user_favorites (stocke en base)


UTILISATEUR B (proche de A, veut offrir)
    |
    v
/shop --> Clique "Commander" sur un article
    |
    v
OrderModal --> "Offrir a quelqu'un" --> Selectionne contact A
    |
    v
Section "Ses souhaits" s'affiche avec la wishlist de A
    |
    v
Peut choisir un article de la wishlist OU continuer avec l'article initial
```

---

## Details techniques

### Fichiers a creer
1. `src/pages/WishlistCatalog.tsx` -- Page catalogue de souhaits
2. `src/hooks/useContactWishlist.ts` -- Hook pour charger la wishlist d'un contact
3. `src/components/ContactWishlistSection.tsx` -- Composant wishlist d'un contact

### Fichiers a modifier
1. `src/components/OrderModal.tsx` -- Ajouter section wishlist apres selection du contact
2. `src/pages/GiftIdeas.tsx` -- Integrer la section wishlist
3. `src/App.tsx` -- Ajouter la route `/wishlist-catalog`

### Base de donnees
- **Aucune migration necessaire** : la table `user_favorites` et les politiques RLS existent deja
- La politique "Friends can view favorites" via `contact_relationships` couvre le besoin de lecture par les proches

### Verification necessaire
- Le champ `linked_user_id` dans la table `contacts` doit exister pour lier un contact a un compte utilisateur (a verifier, sinon une petite migration sera ajoutee)

