

## Corriger le flux de notification WhatsApp quand le beneficiaire n'est pas inscrit

### Probleme

Quand Francoise cree une cagnotte pour Marie-Belle (non inscrite), le code client detecte `beneficiaryUserId = null` et **saute entierement** l'appel a `notify-business-fund-friends`. Resultat : aucun WhatsApp n'est envoye aux proches.

### Solution

Modifier les deux couches pour utiliser le **creator_id comme fallback** quand le beneficiaire n'est pas un utilisateur inscrit :

### Modifications

**1. Client - `src/pages/CollectiveCheckout.tsx` (lignes 225-266)**

- Supprimer le `if (beneficiaryUserId)` qui bloque l'appel
- Ajouter un nouveau parametre `creator_user_id` dans le body envoye a la fonction
- Ajouter `beneficiary_name` (depuis `item.beneficiaryName`) pour que la fonction puisse nommer le beneficiaire meme sans profil
- Toujours appeler la fonction, que `beneficiary_user_id` soit null ou non

```typescript
// AVANT: if (beneficiaryUserId) { ... } else { skip }
// APRES: toujours appeler, avec fallback
const { data: notifyResult } = await supabase.functions.invoke('notify-business-fund-friends', {
  body: {
    fund_id: fundData.id,
    beneficiary_user_id: beneficiaryUserId, // peut etre null
    creator_user_id: currentUserId,         // NOUVEAU - fallback
    beneficiary_name: item.beneficiaryName, // NOUVEAU - nom du contact
    business_name: businessData?.business_name || 'Un commerce',
    product_name: items[0]?.name || 'Un cadeau',
    target_amount: fundData.target_amount,
    currency: fundData.currency || 'XOF'
  }
});
```

**2. Edge Function - `supabase/functions/notify-business-fund-friends/index.ts`**

- Accepter les nouveaux champs `creator_user_id` et `beneficiary_name` dans l'interface `NotifyRequest`
- Determiner le `lookup_user_id` : utiliser `beneficiary_user_id` s'il existe, sinon `creator_user_id`
- Utiliser `beneficiary_name` comme nom du beneficiaire si le profil n'est pas trouve
- Block 1 (friends via `contact_relationships`) : chercher les amis de `lookup_user_id`
- Block 2 (contacts) : chercher les contacts de `lookup_user_id`
- Ajouter un log pour indiquer le mode utilise (beneficiaire vs createur)

Logique simplifiee :
```
lookup_user_id = beneficiary_user_id || creator_user_id
beneficiaryDisplayName = profil_beneficiaire?.nom || beneficiary_name || 'un ami'
// Chercher friends et contacts de lookup_user_id
```

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/CollectiveCheckout.tsx` | Supprimer le guard, ajouter `creator_user_id` et `beneficiary_name` dans le body |
| `supabase/functions/notify-business-fund-friends/index.ts` | Accepter les nouveaux champs, fallback vers creator pour la recherche d'amis/contacts |

### Comportement attendu apres correction

- **Beneficiaire inscrit** : comportement identique a aujourd'hui (amis du beneficiaire notifies)
- **Beneficiaire non inscrit** : les amis et contacts de la **creatrice** (Francoise) sont notifies par WhatsApp avec le template `joiedevivre_group_contribution`
- Le nom du beneficiaire (Marie-Belle) est toujours affiche correctement dans le message WhatsApp

