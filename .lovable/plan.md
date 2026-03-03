

# Correction des parametres WhatsApp dans `notify-fund-ready`

## Analyse : Code actuel vs Templates Meta

### Template `joiedevivre_fund_ready` (prestataire)

Le template Meta attend :

| Variable | Attendu (Meta) | Envoye par le code | Statut |
|----------|----------------|---------------------|--------|
| {{1}} | Prenom du prestataire (ex: "Alain") | `ownerFirstName` | OK |
| {{2}} | Nom du beneficiaire (ex: "Francoise") | `fundTitle` ("Tecno Pop10 64 Go...") | ERREUR |
| {{3}} | Montant (ex: "30000") | `String(fundAmount)` | OK |
| {{4}} | Nom du produit (ex: "Collier en or") | `productName` | OK |
| {{5}} | Nom du beneficiaire (ex: "Francoise") | `beneficiaryName` | OK |
| Bouton {{1}} | fund_id (URL commande) | `bf.fund_id` | OK |

**Probleme** : Le parametre {{2}} recoit le titre complet de la cagnotte au lieu du nom du beneficiaire. Le titre "Tecno Pop10 64 Go 3+3 -2 SIM pour Marie Belle" est trop long et ne correspond pas au format attendu.

### Template `joiedevivre_fund_completed` (amis/contributeurs)

D'apres la memoire du projet, ce template attend 4 parametres : `recipientName`, `fundTitle`, `beneficiaryName`, `fundAmount`.

| Variable | Attendu (Meta) | Envoye par le code | Statut |
|----------|----------------|---------------------|--------|
| {{1}} | Prenom du destinataire | `recipientName` | OK |
| {{2}} | Titre de la cagnotte | `fundTitle` | OK |
| {{3}} | Nom du beneficiaire | `beneficiaryName` | OK |
| {{4}} | Montant | `String(fundAmount)` | OK |
| Bouton {{1}} | fund_id (URL cagnotte) | `fund_id` | OK |

Ce template semble correctement alimente. L'erreur Meta #100/#132012 sur ce template pourrait venir de la longueur du `fundTitle` (ex: "Tecno Pop10 64 Go 3+3 -2 SIM pour Marie Belle" = 48 chars) qui depasse une limite Meta, ou de caracteres speciaux.

## Corrections a appliquer

### Fichier : `supabase/functions/notify-fund-ready/index.ts`

**Correction 1 (ligne 131)** -- `joiedevivre_fund_ready` : Remplacer `fundTitle` par `beneficiaryName` en position {{2}}

```text
Avant :  trimParams([ownerFirstName, fundTitle, String(fundAmount), productName, beneficiaryName])
Apres :  trimParams([ownerFirstName, beneficiaryName, String(fundAmount), productName, beneficiaryName])
```

**Correction 2** -- Securiser la longueur des parametres : Ajouter une fonction de troncature pour s'assurer qu'aucun parametre ne depasse la limite Meta (1024 chars pour le body, mais en pratique des textes trop longs causent des rejets).

```text
function safeParam(value: string, maxLen = 200): string {
  const cleaned = value.trim();
  return cleaned.length > maxLen ? cleaned.substring(0, maxLen) : cleaned;
}
```

**Correction 3** -- Appliquer `safeParam` aux deux appels de template pour tronquer les noms/titres trop longs.

### Apres deploiement

Relancer `notify-fund-ready` pour la cagnotte "Tecno Pop10" (`4224309f`) afin de verifier que les WhatsApp passent correctement avec les bons parametres.

## Fichiers modifies

1. `supabase/functions/notify-fund-ready/index.ts` -- correction du parametre {{2}} et ajout de la protection de longueur

