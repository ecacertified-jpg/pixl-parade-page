

# Notifier les amis lors de l'achevement de la cagnotte (100%)

## Objectif

Etendre la fonction `notify-fund-ready` pour qu'elle envoie, en plus de la notification au prestataire, un message WhatsApp de felicitations a tous les amis (contributeurs ET non-contributeurs) de la cagnotte.

## Prerequis : Nouveau template Meta WhatsApp

Un nouveau template HSM doit etre cree sur le Meta Business Manager :

**Nom** : `joiedevivre_fund_completed`
**Categorie** : Utility
**Langue** : French (fr)
**Corps** :
```text
Felicitations {{1}} !

La cagnotte "{{2}}" pour {{3}} a atteint son objectif de {{4}} XOF !

Merci pour votre generosite. Le cadeau va bientot etre prepare.
```

**Bouton CTA** : "Voir la cagnotte" -> URL dynamique `/f/{{1}}`

**Parametres** :
1. `recipientName` - Prenom du destinataire
2. `fundTitle` - Titre de la cagnotte
3. `beneficiaryName` - Nom du beneficiaire
4. `fundAmount` - Montant atteint (string)

**Bouton** : 1 parametre `fund_id`

> Vous devrez creer ce template dans le gestionnaire WhatsApp Meta avant que les envois fonctionnent. En attendant son approbation, la fonction est prete a l'utiliser.

## Modification technique

**Fichier** : `supabase/functions/notify-fund-ready/index.ts`

Apres l'envoi au prestataire (ligne 134), ajouter une nouvelle section qui :

1. **Collecte tous les contributeurs** de la cagnotte via `fund_contributions`
2. **Collecte les amis du createur** via `contact_relationships` (avec `can_see_funds = true`)
3. **Collecte les amis du beneficiaire** via `linked_user_id` + `contact_relationships`
4. **Deduplique par numero de telephone** (meme pattern que `notify-contribution-progress` avec un `Set<string>`)
5. **Envoie le template `joiedevivre_fund_completed`** a chaque destinataire unique avec `trimParams`
6. **Cree une notification in-app** pour chaque destinataire

### Pseudo-code de la nouvelle section

```text
// --- Notify friends section ---
sentPhones = Set() // deduplication
// Exclure le prestataire
if (business.phone) sentPhones.add(normalize(business.phone))

// A. Contributeurs
contributions = SELECT contributor_id FROM fund_contributions WHERE fund_id = X
for each contributor profile with phone:
  sendWhatsAppTemplate('joiedevivre_fund_completed', [name, title, beneficiary, amount], [fund_id])

// B. Amis du createur
creatorFriends = contact_relationships WHERE user_a/user_b = creator_id AND can_see_funds
for each non-notified friend:
  sendWhatsAppTemplate(...)

// C. Amis du beneficiaire (via linked_user_id)
if beneficiary has linked_user_id:
  beneficiaryFriends = contact_relationships WHERE user_a/user_b = beneficiary_user_id AND can_see_funds
  for each non-notified friend:
    sendWhatsAppTemplate(...)
```

### Ajout de `trimParams`

Meme utilitaire que dans `notify-contribution-progress` pour eviter les erreurs Meta #100.

## Flux complet apres modification

```text
Cagnotte atteint 100%
  |
  [Trigger -> notify-fund-ready]
  |
  +-- WhatsApp joiedevivre_fund_ready -> Prestataire
  |
  +-- WhatsApp joiedevivre_fund_completed -> Contributeurs
  |
  +-- WhatsApp joiedevivre_fund_completed -> Amis du createur
  |
  +-- WhatsApp joiedevivre_fund_completed -> Amis du beneficiaire
  |
  +-- Notifications in-app pour tous
```

## Fichiers modifies

- `supabase/functions/notify-fund-ready/index.ts` : ajout de la logique de notification des amis + `trimParams`

## Gestion des cas non-business

Actuellement la fonction fait un `return` si `bf` (business_collective_funds) est null. Pour les cagnottes non-business, on pourrait aussi notifier les amis. Cependant, pour rester dans le scope de la demande (cagnottes business), cette logique ne s'appliquera qu'aux cagnottes liees a un prestataire.

