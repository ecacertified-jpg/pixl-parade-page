

# Plan : Afficher la wishlist du bénéficiaire pour créer une cagnotte

## Problème
Sur la page d'anniversaire de **Nacoulma**, cliquer sur "Créer une cagnotte pour Nacoulma" redirige vers `/gifts`. L'utilisateur doit ensuite chercher manuellement les souhaits. Or il faut afficher directement le modal "Ma liste de souhaits **de Nacoulma**" pour que l'initiateur choisisse un article de la wishlist du bénéficiaire.

## Solution
Réutiliser `WishlistFundPickerModal` en le rendant générique — capable d'afficher la wishlist de **n'importe quel utilisateur** (pas uniquement la sienne), et l'ouvrir directement depuis le bouton sur `BirthdayPage`.

## Changements

### 1. `src/components/WishlistFundPickerModal.tsx` — rendre générique

- Ajouter props optionnelles : `beneficiaryUserId?: string`, `beneficiaryFirstName?: string`, `beneficiaryLastName?: string`, `beneficiaryAvatarUrl?: string`.
- Si `beneficiaryUserId` fourni et différent de `user.id` :
  - Récupérer les favoris via une requête directe (`supabase.from('user_favorites').select('*, products(*)').eq('user_id', beneficiaryUserId)`) au lieu du hook `useFavorites` qui ne sert que l'utilisateur courant.
  - Adapter le titre : "Liste de souhaits de Nacoulma" + le sous-titre.
  - Quand l'utilisateur clique "Créer", ajouter au panier avec `beneficiaryName = "Nacoulma X."`, `beneficiaryId = beneficiaryUserId`, `isSelfFund: false`.
- Sinon (cas existant), garder le comportement self-fund inchangé.
- Gérer l'état vide spécifique : "Nacoulma n'a pas encore d'articles dans sa liste de souhaits" (sans bouton "Ajouter des articles" qui n'a pas de sens pour quelqu'un d'autre).

**Note sécurité** : la RLS `Friends can view favorites` autorise déjà la lecture si l'initiateur et le bénéficiaire sont liés via `contact_relationships`. Si la requête renvoie 0 résultat alors que la wishlist existe, afficher un message clair invitant à devenir ami.

### 2. `src/pages/BirthdayPage.tsx` — ouvrir le modal au clic

- Ajouter un state `showWishlistPicker` et importer `WishlistFundPickerModal`.
- Remplacer `navigate('/gifts')` du bouton "Créer une cagnotte pour {firstName}" par `setShowWishlistPicker(true)`.
- Monter `<WishlistFundPickerModal>` avec `beneficiaryUserId={page.user_id}`, `beneficiaryFirstName={firstName}`, et l'avatar du bénéficiaire.
- Conserver le check `if (!user) navigate('/auth?...')` avant d'ouvrir le modal.

## Fichiers concernés

| Fichier | Changement |
|---------|------------|
| `src/components/WishlistFundPickerModal.tsx` | Accepter un bénéficiaire externe, fetch ciblé, titre dynamique, état vide adapté |
| `src/pages/BirthdayPage.tsx` | Ouvrir le modal au clic au lieu de naviguer vers `/gifts` |

## Résultat
Sur la page d'anniversaire de Nacoulma, cliquer sur "Créer une cagnotte pour Nacoulma" ouvre immédiatement un modal listant **les souhaits de Nacoulma**. L'initiateur sélectionne un article et est redirigé vers le panier en mode cagnotte collaborative pour Nacoulma.

