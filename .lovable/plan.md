## Objectif

Ajouter, **en tête de la modale** « Ma liste de souhaits » / « Liste de souhaits de X », un bouton prioritaire permettant de créer une **cagnotte en argent** : pas d'article, le montant collecté *est* le cadeau et il est versé au bénéficiaire quand l'objectif est atteint.

## Parcours utilisateur

1. Dans `WishlistFundPickerModal`, au-dessus de la liste d'articles : une carte CTA mise en avant (icône billets, dégradé primaire) — « Offrir de l'argent » / « Offrir de l'argent à {Prénom} », sous-titre « Le montant collecté est directement le cadeau ».
2. Clic → nouvelle modale `CashGiftFundModal` :
   - Montants suggérés en chips (5 000 / 10 000 / 25 000 / 50 000 XOF) + champ « Autre montant ».
   - Titre auto-rempli et modifiable (« Cadeau en argent pour Awa »), message/description optionnel, date limite optionnelle, occasion.
   - Si visiteur non connecté → redirection `/auth` avec `returnTo` (même logique que le flux existant).
3. Création de la cagnotte puis navigation vers `/f/:id` — exactement la même route de partage/contribution que les cagnottes article.
4. Sur `/f/:id`, à la place du bloc produit : un bloc « Cadeau en argent » (montant cible, bénéficiaire, mention « versé directement au bénéficiaire »).
5. À 100 % : le bénéficiaire voit un panneau vert « Recevoir mon cadeau (Wave) » (même pattern que le panneau Jumia existant) ; un enregistrement de versement passe en attente côté admin.

## Détails techniques

**Migration**
- `collective_funds` : `is_cash_gift boolean not null default false`, `beneficiary_user_id uuid` (utile pour cibler le bénéficiaire quand ce n'est pas un contact).
- Nouvelle table `cash_gift_payouts` (fund_id, beneficiary_user_id, amount, currency, status `pending|paid|failed`, payout_reference, paid_at, created_at/updated_at + trigger updated_at).
- GRANTs : `SELECT` authenticated, `ALL` service_role ; RLS : lecture par créateur + bénéficiaire + admin (`is_admin(auth.uid())`), écriture admin uniquement.

**Front**
- `src/components/CashGiftFundModal.tsx` (nouveau) : formulaire montant + création via `useEnsureProfile()` puis insert `collective_funds` avec `is_cash_gift: true`, `is_public: true`, `beneficiary_user_id`, `beneficiary_contact_id` si dispo ; appel best-effort `link-fund-to-birthday-page` comme le flux article.
- `src/components/WishlistFundPickerModal.tsx` : bouton prioritaire en haut + rendu de la nouvelle modale ; le libellé s'adapte au cas « pour moi » vs « pour X ».
- `src/pages/FundPreview.tsx` : branche `is_cash_gift` pour le bloc de présentation et le panneau de versement Wave à 100 %.

**Backend**
- `supabase/functions/process-fund-completion/index.ts` : avant les branches produit externe / business_order, si `is_cash_gift` → insérer un `cash_gift_payouts` en `pending` et notifier (réutilisation des notifications existantes de complétion), sans créer de commande.

## Hors périmètre
Pas de nouvel écran admin dédié dans cette itération : les versements en attente seront visibles via requête/administration existante ; on pourra ajouter `/admin/cash-payouts` ensuite si tu le souhaites.
