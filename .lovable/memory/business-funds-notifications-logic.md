Le système de notification des cagnottes business est automatisé via des triggers de base de données.

## Flux de notification

1. **À la création** : l'Edge Function `notify-business-fund-friends` marque la cagnotte comme publique, invite les proches via `joiedevivre_group_contribution` et invite le bénéficiaire non inscrit via `joiedevivre_fund_beneficiary_invite`.

2. **Accès public** : la page `FundPreview.tsx` (`/f/:id`) gère l'accès anonyme aux données publiques et redirige les contributeurs vers l'onglet COTISATIONS du dashboard après connexion.

3. **Suivi en temps réel** : chaque contribution déclenche `notify-contribution-progress`. Le template **`joiedevivre_contribution_update`** est unifié pour informer contributeurs ET non-contributeurs de la progression (%) et des jours restants (priorité anniversaire bénéficiaire > deadline), avec un intervalle de déduplication de 4h. Ce template utilise 6 paramètres.

4. **À l'achèvement (100%)** : `notify-fund-ready` alerte immédiatement le prestataire par WhatsApp (`joiedevivre_fund_ready`, 5 paramètres) et in-app.

## Template unifié (contribution_update)

L'ancien template `joiedevivre_contribution_nudge` a été abandonné (rejeté par Meta). Le template `joiedevivre_contribution_update` le remplace en couvrant les deux audiences avec un seul modèle HSM.
