

## Corriger l'envoi WhatsApp aux amis lors du checkout collectif

### Probleme identifie

La cagnotte a ete creee via `CollectiveCheckout.tsx` (flux panier boutique), qui appelle `notify-reciprocity` mais **n'appelle pas** `notify-business-fund-friends`. L'appel WhatsApp aux amis du beneficiaire n'existe que dans `BusinessCollaborativeGiftModal.tsx` (un autre chemin de creation non utilise ici).

### Correction

**Fichier** : `src/pages/CollectiveCheckout.tsx`

Ajouter l'appel a `notify-business-fund-friends` juste apres l'appel a `notify-reciprocity` (apres ligne 221), en conditionnant sur la presence d'un `createdByBusinessId` (cagnotte business) :

```ts
// Notifier les amis du beneficiaire via WhatsApp (cagnottes business uniquement)
if (createdByBusinessId && fundData.id) {
  try {
    console.log('📧 Invoking notify-business-fund-friends from checkout');

    const { data: businessData } = await supabase
      .from('business_accounts')
      .select('business_name')
      .eq('id', createdByBusinessId)
      .single();

    await supabase.functions.invoke('notify-business-fund-friends', {
      body: {
        fund_id: fundData.id,
        beneficiary_user_id: items[0]?.beneficiaryId || null,
        business_name: businessData?.business_name || 'Un commerce',
        product_name: items[0]?.name || 'Un cadeau',
        target_amount: fundData.target_amount,
        currency: fundData.currency || 'XOF'
      }
    });
    console.log('✅ Notify-business-fund-friends invoked successfully');
  } catch (friendsNotifyError) {
    console.warn('⚠️ Error invoking notify-business-fund-friends (non-blocking):', friendsNotifyError);
  }
}
```

### Pourquoi cela fonctionne

- Le `createdByBusinessId` est deja recupere plus haut dans le code (ligne 144)
- Le `beneficiaryId` est disponible dans les items du panier
- L'appel est non-bloquant (try/catch) pour ne pas affecter le flux de commande
- L'Edge Function `notify-business-fund-friends` gere deja toute la logique : recuperation des amis, deduplication, envoi WhatsApp template

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/CollectiveCheckout.tsx` | Ajout de l'appel a `notify-business-fund-friends` apres `notify-reciprocity` |

