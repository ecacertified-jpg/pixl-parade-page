

## Diagnostic

### Problème 1 — Chandy ne voit que 3 articles sur 7

**Vérification DB** : Chandy (`2702a401…`) a bien **7 favoris actifs** en base, tous liés à des produits `is_active=true` (MEGA HAPPY, MAHUDJLO, Détox + 4 iPhone ajoutés le 24/04).

Le hook `useFavorites` charge bien les 7. `WishlistFundPickerModal` rend `favorites.map()` sans `.slice()`. La liste est dans un conteneur `flex-1 overflow-y-auto` **donc scrollable**, mais :

- Hauteur du Dialog : `max-h-[85vh]` avec header (~80px) + footer (~70px) + padding → la zone visible affiche pile 3 cartes (~150px chacune), ce qui remplit l'espace sans laisser apparaître de demi-carte coupée → **aucun indice visuel** que la liste est scrollable.
- Aucun compteur du type "7 articles" en haut.
- Pas d'ombre/dégradé en bas pour suggérer le scroll.

L'utilisateur croit donc qu'il n'a que 3 articles.

### Problème 2 — La liste de souhaits de Samira ne s'affiche pas sur sa page partagée

**Vérification DB** : Samira (`7e641afb…`) a **3 favoris**, page `samira-2026`. Pourtant la modale "Liste de souhaits de samira" affiche le vide + l'icône `UserPlus`.

**Cause racine** — RLS sur `user_favorites` :
```
SELECT autorisé seulement si :
  - auth.uid() = user_id (le propriétaire), OU
  - relation d'amitié dans contact_relationships, OU
  - admin
```

La page `/birthday/samira-2026` partagée sur les réseaux sociaux est consultée par des **visiteurs non connectés** (ou connectés mais non-amis). La requête `supabase.from('user_favorites').select(...).eq('user_id', samira)` retourne donc `[]` **sans erreur** (RLS filtre silencieusement).

Dans `WishlistFundPickerModal`, le code distingue `accessDenied` uniquement quand `error != null` (or RLS ne renvoie pas d'erreur, juste des lignes vides) → le composant affiche "samira n'a pas encore d'articles" alors qu'en réalité **les articles existent mais sont masqués par la RLS**.

C'est un blocage critique du flow viral : impossible pour un ami de cotiser en parcourant la liste de souhaits depuis un lien partagé.

## Plan

### Fix 1 — Modal "Ma liste de souhaits" : indicateur de scroll + compteur

Dans `src/components/WishlistFundPickerModal.tsx` :

1. **Sous-titre** : ajouter le compteur dynamique
   - Ex. "3 articles" → devient "**7 articles** — Choisissez-en un pour créer votre cagnotte"
2. **Hauteur** : ajuster `max-h-[85vh]` à `h-[85vh]` (hauteur fixe) pour que la zone scroll soit toujours définie ; `min-h-[500px]` pour mobile.
3. **Indicateur visuel de scroll** :
   - Ajouter un overlay dégradé `bg-gradient-to-t from-background to-transparent` en bas de la zone scroll (sticky), visible quand `favorites.length > 3`.
   - Ajouter un petit `ChevronDown` animé (bounce) quand il reste du contenu à scroller.
4. **Pré-charger plus** : laisser visible un demi-item (3,5 cartes apparentes) en réduisant `space-y-3` à `space-y-2` et en réduisant `p-3` à `p-2.5` pour montrer qu'il y a de la suite.

### Fix 2 — Liste de souhaits visible publiquement sur les pages d'anniversaire partagées

**Décision produit** : la wishlist d'une page d'anniversaire publiée doit être lisible par toute personne arrivant via le lien partagé (logique de viralité — sinon impossible de cotiser).

#### A) Migration RLS — politique de lecture publique conditionnelle

Ajouter une politique `SELECT` sur `user_favorites` :

```sql
CREATE POLICY "Anyone can view favorites of users with active birthday page"
ON public.user_favorites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM birthday_pages
    WHERE birthday_pages.user_id = user_favorites.user_id
      AND birthday_pages.is_active = true
      AND birthday_pages.published_at IS NOT NULL
  )
);
```

→ N'expose que les favoris des utilisateurs **ayant publié** une page d'anniversaire (cohérent avec le caractère public déjà accepté de ces pages). Les favoris d'un utilisateur sans page publiée restent privés (politiques existantes inchangées).

#### B) Distinction "accès refusé" vs "vide réel" dans le composant

Dans `WishlistFundPickerModal.tsx` (branche `isExternalBeneficiary`) :
- Quand `data` est vide ET le visiteur est anonyme/non-ami, ne plus afficher "n'a pas encore d'articles" par défaut. Faire un second check : si la page d'anniversaire existe et qu'on a 0 favoris remontés → message neutre "Aucun article à afficher pour le moment" + bouton "Créer une cagnotte personnalisée" (montant libre via `SearchExistingFundsModal` ou flow custom).

### Fichiers modifiés / créés

- `supabase/migrations/<timestamp>_public_wishlist_for_birthday_pages.sql` (nouvelle politique RLS)
- `src/components/WishlistFundPickerModal.tsx` (compteur, hauteur, overlay scroll, message vide amélioré)

### Mémoires à mettre à jour

- `mem://features/wishlist-and-gifting-system` : ajouter "Les favoris d'un utilisateur ayant publié une page d'anniversaire (`is_active + published_at`) sont lisibles publiquement, pour permettre aux visiteurs du lien partagé de voir et cotiser sur les souhaits."

## Résultat attendu

1. ✅ Chandy voit ses **7 articles** — compteur "7 articles" en haut + indicateur de scroll en bas + 3,5 cartes visibles à l'ouverture pour suggérer le défilement.
2. ✅ Tout visiteur de la page partagée `/birthday/samira-2026` (anonyme inclus) voit les **3 articles** de la liste de souhaits de Samira et peut créer une cagnotte sur l'un d'eux.
3. ✅ Si la liste est réellement vide, message clair + alternative "cagnotte montant libre".

