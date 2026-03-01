

# Unifier les notifications WhatsApp en un seul template

## Contexte

Meta refuse le template `joiedevivre_contribution_nudge` car trop similaire au `joiedevivre_contribution_update` deja approuve. La solution : utiliser le meme template `joiedevivre_contribution_update` pour les deux audiences (contributeurs existants ET amis non-contributeurs).

## Pourquoi ca fonctionne

Le message actuel du template `joiedevivre_contribution_update` est deja suffisamment generique :

> Bonjour {{1}} !
> Bonne nouvelle : {{2}} vient de contribuer a la cagnotte pour {{3}}.
> La cagnotte a atteint {{4}}% de l'objectif ({{5}} XOF).
> Plus que {{6}} jours avant le jour J !
> [Voir la cagnotte]

Ce message informe de la progression sans presupposer que le destinataire a deja contribue. Il convient aussi bien a un contributeur existant qu'a un ami qui n'a pas encore participe : le bouton "Voir la cagnotte" invite naturellement a consulter et eventuellement contribuer.

## Modification a effectuer

### Fichier : `supabase/functions/notify-contribution-progress/index.ts`

Remplacer l'envoi via `joiedevivre_contribution_nudge` (section 9, lignes 157-193) par l'envoi via `joiedevivre_contribution_update` avec les **6 memes parametres** :

- `recipientName` (prenom du destinataire)
- `contributorName` (prenom du contributeur)
- `beneficiaryName` (prenom du beneficiaire)
- `String(percentage)` (pourcentage atteint)
- `currentAmountStr` (montant actuel en XOF)
- `daysRemaining` (jours restants)

Concretement, la seule ligne qui change dans la section 9 est le nom du template : `'joiedevivre_contribution_nudge'` devient `'joiedevivre_contribution_update'`, et les parametres passent de 5 a 6 (ajout de `currentAmountStr`).

### Fichier : `.lovable/plan.md`

Mettre a jour le plan pour refleter l'utilisation d'un seul template.

## Aucune modification Meta requise

Le template `joiedevivre_contribution_update` est deja **actif** sur Meta Business Manager. Aucune action supplementaire n'est necessaire cote Meta. Le template `joiedevivre_contribution_nudge` n'a pas besoin d'etre cree.

## Impact technique

- Un seul template WhatsApp au lieu de deux
- Meme message envoye a tous les destinataires (contributeurs et amis)
- Simplification de la maintenance et du suivi des performances dans le dashboard admin

