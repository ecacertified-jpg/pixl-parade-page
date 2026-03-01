

# Mettre a jour les memoires du projet

## Objectif

Supprimer toute reference au template `joiedevivre_contribution_nudge` dans les memoires du projet, puisqu'il a ete remplace par le template unifie `joiedevivre_contribution_update`.

## Fichiers a creer/modifier

### 1. `.lovable/memory/whatsapp-messaging-strategy.md`

Creer ce fichier memoire avec la liste corrigee des templates WhatsApp actifs, en retirant `joiedevivre_contribution_nudge` de la liste. Mentionner explicitement que ce template a ete abandonne au profit de `joiedevivre_contribution_update` unifie.

Templates actifs a lister :
- `joiedevivre_otp`
- `joiedevivre_contact_added`
- `joiedevivre_birthday_reminder`
- `joiedevivre_refund_alert`
- `joiedevivre_contribution_reminder`
- `joiedevivre_gift_order`
- `joiedevivre_group_contribution`
- `joiedevivre_fund_beneficiary_invite`
- `joiedevivre_contribution_update` (unifie : contributeurs + non-contributeurs)
- `joiedevivre_fund_ready`

### 2. `.lovable/memory/business-funds-notifications-logic.md`

Creer ce fichier memoire avec la logique de notification mise a jour, confirmant que `notify-contribution-progress` utilise un seul template (`joiedevivre_contribution_update`) pour les deux audiences.

### 3. `.lovable/plan.md`

Vider le plan actuel (la correction de validation de gratitude est deja appliquee).

## Impact

Mise a jour documentaire uniquement. Aucune modification de code applicatif.

