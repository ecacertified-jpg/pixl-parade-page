# Plan de correction

## Objectif
Corriger l’erreur qui apparaît quand Eca lance sa propre cagnotte depuis sa page d’anniversaire.

## Ce que je vais faire
1. **Cibler le vrai parcours en erreur**
   - Vérifier le flux exact : pop-up “Créer ma cagnotte” → liste de souhaits → panier → bouton **“Lancer ma cagnotte”** dans `CollectiveCheckout`.
   - Confirmer que l’erreur se produit bien au moment de créer l’enregistrement de cagnotte, pas dans un pop-up annexe.

2. **Corriger la cause côté base de données**
   - Auditer les triggers/fonctions réellement exécutés sur `collective_funds` lors de la création.
   - Supprimer toute référence restante à `NEW.contributor_id` dans le chemin de création d’une cagnotte.
   - Conserver le comportement attendu sur `fund_contributions`, où `contributor_id` existe bien.

3. **Sécuriser le retour côté interface**
   - Vérifier le message affiché dans `CollectiveCheckout` pour ne plus exposer un message SQL brut à l’utilisateur.
   - Harmoniser le message avec le vocabulaire produit (“cagnotte” plutôt que “cotisation”) si nécessaire.

4. **Valider le parcours complet**
   - Re-tester la création d’une cagnotte propriétaire depuis la page d’anniversaire.
   - Vérifier qu’après création, la navigation et les étapes suivantes continuent de fonctionner normalement.

## Constat déjà confirmé
- Le correctif appliqué sur `trigger_badge_check()` existe bien en base.
- L’erreur visible par l’utilisateur vient du parcours **self-fund** dans `src/pages/CollectiveCheckout.tsx`.
- Il reste donc très probablement **un autre trigger/fonction actif dans ce flux** qui remonte encore cette référence invalide.

## Détails techniques
- Fichiers déjà identifiés côté frontend :
  - `src/pages/BirthdayPage.tsx`
  - `src/components/WishlistFundPickerModal.tsx`
  - `src/pages/CollectiveCheckout.tsx`
- Tables / objets base concernés :
  - `public.collective_funds`
  - `public.fund_contributions`
  - triggers liés à `collective_funds`
- Si la cause est bien en base, je proposerai **une migration ciblée** avant toute autre modif frontend lourde.