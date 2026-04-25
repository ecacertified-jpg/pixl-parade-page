---
name: Cagnottes — navigation, contribution publique et invité
description: Règles d'accès aux contributions, contributions invité (non inscrits) et flux de partage public via /f/:id
type: feature
---

## Accès aux cagnottes

- Route principale `/f/:id` (`FundPreview`) pour les liens partagés.
- La fonction SQL `can_contribute_to_fund(fund_uuid)` autorise :
  - **Tout utilisateur authentifié** dès que `collective_funds.is_public = true` ET `status = 'active'`.
  - Le créateur de la cagnotte.
  - Les amis du créateur (`contact_relationships.can_see_funds = true`) pour les cagnottes privées.
  - Les amis du bénéficiaire pour les cagnottes privées.

## Contributions invité (non inscrits)

- Table `fund_contributions` accepte `contributor_id = NULL` quand `is_guest = true` ET (`guest_name`, `guest_phone`) renseignés. Une contrainte `fund_contributions_contributor_or_guest_chk` garantit l'intégrité.
- L'INSERT invité ne passe PAS par RLS client : il est effectué exclusivement via l'Edge Function publique `contribute-as-guest` (`verify_jwt = false`) qui utilise la `service_role_key`.
- L'Edge Function refuse les contributions invité sur les cagnottes non publiques (`is_public = false`).
- Champs collectés : `guest_name` (obligatoire), `guest_phone` (obligatoire), `guest_email` (optionnel).

## Flux dans `ContributionModal`

- Si `!user && isFromPublicFund` → mode invité : champs nom/téléphone/email + appel à `contribute-as-guest`.
- Si `user && isFromPublicFund` → INSERT direct (RLS via la fonction `can_contribute_to_fund` autorise).
- Si `user && !isFromPublicFund` → pré-check `can_contribute_to_fund` (amitié requise) puis INSERT.
- Le pré-check `can_contribute_to_fund` est sauté pour les cagnottes publiques (déjà couvert par RLS).

## Pages d'anniversaire

- Le bouton "Participer au cadeau" sur `BirthdayPage` ne redirige plus vers `/auth` : il navigue directement vers `/f/:fundId` où le visiteur (inscrit ou non) peut contribuer.
- `FundPreview.handleContribute` ouvre directement le modal sans redirection auth.