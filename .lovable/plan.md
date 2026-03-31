# Plan : Cagnotte pour soi-meme depuis la wishlist + partage aux cercles d'amis

## Resume

Permettre a l'utilisateur de creer une cagnotte pour lui-meme depuis sa liste de souhaits, puis apres finalisation, afficher un selecteur de cercles d'amis pour partager sa page d'anniversaire sur les reseaux sociaux.

## Modifications

### 1. Bouton "Creer ma cagnotte" sur la page Favorites

**Fichier** : `src/pages/Favorites.tsx`

Ajouter un bouton "Creer ma cagnotte" visible en haut de la page (sous les stats). Ce bouton ouvre le `ShopForCollectiveGiftModal` pre-configure pour soi-meme, OU mieux : ouvre directement un nouveau modal permettant de selectionner un article de sa wishlist pour creer une cagnotte.

### 2. Boutons "Creer ma cagnotte" / "Cotiser pour un autre" dans le SearchExistingFundsModal

**Fichier** : `src/components/SearchExistingFundsModal.tsx`

Remplacer le bouton unique "Creer une nouvelle cagnotte" en bas par deux boutons :

- "Creer ma cagnotte" → ouvre le flow self-fund
- "Cotiser pour un autre" → flow existant (`onCreateNew`)

### 3. Autoriser la selection de soi-meme dans CollaborativeGiftModal

**Fichier** : `src/components/CollaborativeGiftModal.tsx`

- Supprimer le filtre qui exclut l'utilisateur connecte de la liste des contacts (lignes 106-110)
- Ajouter l'utilisateur connecte en premiere position dans la liste avec son profil (prenom/nom depuis `profiles` ou `user_metadata`)
- Quand l'utilisateur se selectionne lui-meme, marquer l'item avec un flag `isSelfFund: true`

### 4. Creer un composant ShareBirthdayToCirclesModal

**Nouveau fichier** : `src/components/ShareBirthdayToCirclesModal.tsx`

Modal affiche apres la finalisation d'une cagnotte pour soi-meme. Contenu :

- Liste des cercles d'amis de l'utilisateur (via `useFriendCircles`)
- Cases a cocher pour selectionner des cercles ou des amis individuels
- Bouton "Partager ma page d'anniversaire" qui :
  - Genere le lien de la page d'anniversaire
  - Ouvre le partage natif (`navigator.share`) ou copie le message viral avec l'URL
  - Message viral incluant le lien vers la page d'anniversaire

### 5. Declencher le partage apres finalisation de la cagnotte pour soi

**Fichier** : `src/pages/CollectiveOrderConfirmation.tsx`

- Detecter si `beneficiaryName` correspond au nom de l'utilisateur connecte (self-fund)
- Si oui, afficher automatiquement le `ShareBirthdayToCirclesModal` au lieu de la page de confirmation classique, ou en plus de celle-ci
- Alternative : ajouter un bouton "Partager ma page d'anniversaire" sur la page de confirmation quand c'est une self-cagnotte

### 6. Passer le flag self-fund dans le flow checkout

**Fichier** : `src/pages/CollectiveCheckout.tsx`

- Quand `beneficiaryContactId` correspond a l'utilisateur connecte (ou flag `isSelfFund`), passer `occasion: 'birthday'` au lieu de `'cadeau'` dans le fund insert
- Transmettre un flag `isSelfFund: true` dans le state de navigation vers la confirmation

## Fichiers concernes


| Fichier                                          | Action                                            |
| ------------------------------------------------ | ------------------------------------------------- |
| `src/pages/Favorites.tsx`                        | Ajouter bouton "Creer ma cagnotte"                |
| `src/components/SearchExistingFundsModal.tsx`    | Split bouton en "Ma cagnotte" / "Pour autrui"     |
| `src/components/CollaborativeGiftModal.tsx`      | Ajouter l'utilisateur comme beneficiaire possible |
| `src/components/ShareBirthdayToCirclesModal.tsx` | Nouveau : modal de partage aux cercles            |
| `src/pages/CollectiveCheckout.tsx`               | Flag self-fund + occasion birthday                |
| `src/pages/CollectiveOrderConfirmation.tsx`      | Afficher modal de partage si self-fund            |


## Detail technique

### CollaborativeGiftModal - Ajout de soi-meme

```typescript
// Ajouter l'utilisateur connecte en tete de liste
const selfEntry: Contact = {
  id: 'self',
  name: `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim() || 'Moi',
  relationship: 'Moi-meme',
  birthday: undefined, // sera recupere depuis profiles
  avatar_url: session.user.user_metadata?.avatar_url
};

setContacts([selfEntry, ...formattedContacts]);
```

Quand "self" est selectionne, le cart item porte `isSelfFund: true` et `beneficiaryName` = le nom de l'utilisateur.

### ShareBirthdayToCirclesModal

```text
┌────────────────────────────────────┐
│ 🎂 Partagez votre page            │
│    d'anniversaire !                │
│                                    │
│ Selectionnez vos cercles d'amis :  │
│                                    │
│ [x] Famille (8 amis)               │
│ [ ] Collegues (5 amis)             │
│ [x] Amis proches (12 amis)         │
│                                    │
│ [🎉 Partager sur WhatsApp]         │
│ [📋 Copier le lien]                │
└────────────────────────────────────┘
```

Le message viral contient le lien vers `/birthday/{slug}` avec la cagnotte visible, le compte a rebours, les messages, l'album souvenir, les videos et images - tout ce qui est deja en place sur la page d'anniversaire.