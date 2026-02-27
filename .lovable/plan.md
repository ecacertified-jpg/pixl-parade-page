

## Envoyer une invitation WhatsApp au beneficiaire non inscrit

### Contexte

Quand Francoise cree une cagnotte pour Marie-Belle (non inscrite), les amis sont notifies mais **Marie-Belle elle-meme ne recoit aucun message**. Le numero de telephone du beneficiaire (`beneficiaryPhone`) est deja collecte dans le formulaire de checkout.

### Solution

Ajouter un bloc dans l'Edge Function `notify-business-fund-friends` pour envoyer un WhatsApp d'invitation au beneficiaire quand il n'est pas inscrit sur la plateforme (`beneficiary_user_id` est null).

### Modifications

**1. Client - `src/pages/CollectiveCheckout.tsx`**

Ajouter `beneficiary_phone` dans le body envoye a `notify-business-fund-friends` :

```typescript
body: {
  // ... champs existants
  beneficiary_phone: beneficiaryPhone, // NOUVEAU
}
```

**2. Edge Function - `supabase/functions/notify-business-fund-friends/index.ts`**

- Ajouter `beneficiary_phone` a l'interface `NotifyRequest`
- Apres les notifications aux amis/contacts, ajouter un bloc d'invitation au beneficiaire :
  - Condition : `beneficiary_user_id` est null ET `beneficiary_phone` est fourni
  - Verifier que le numero du beneficiaire n'a pas deja ete notifie (deduplication via `notifiedPhones`)
  - Envoyer le template WhatsApp `joiedevivre_fund_beneficiary_invite` avec :
    - Parametres body : `[beneficiary_name, creator_name, product_name, formatted_amount]`
    - Parametres bouton : `[fund_id]` (CTA vers `/f/{fund_id}`)
  - Recuperer le `first_name` du createur depuis la table `profiles` pour personnaliser le message
- Retourner `beneficiary_invited: true/false` dans la reponse

**3. Template WhatsApp a creer dans Meta Business Manager**

Nom : `joiedevivre_fund_beneficiary_invite`
Categorie : Marketing
Langue : Francais (fr)
Corps :
```
Bonjour {{1}} ! {{2}} a cree une cagnotte pour vous offrir "{{3}}" (objectif : {{4}} XOF). 
Inscrivez-vous sur Joie de Vivre pour suivre la cagnotte et decouvrir votre cadeau !
```
Bouton CTA : "Voir ma cagnotte" -> `https://joiedevivre-africa.com/f/{{1}}`

### Logique simplifiee

```text
SI beneficiary_user_id est null ET beneficiary_phone existe
  ET beneficiary_phone PAS dans notifiedPhones (deduplication)
ALORS
  -> Envoyer joiedevivre_fund_beneficiary_invite au beneficiaire
  -> Logger le resultat
  -> Retourner beneficiary_invited: true
```

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/CollectiveCheckout.tsx` | Ajouter `beneficiary_phone` dans le body de l'appel |
| `supabase/functions/notify-business-fund-friends/index.ts` | Ajouter le bloc d'invitation WhatsApp au beneficiaire |

### Action manuelle requise

Creer le template `joiedevivre_fund_beneficiary_invite` dans le Meta Business Manager avant de tester. En attendant l'approbation du template, la fonction loguera un warning et continuera sans erreur.

