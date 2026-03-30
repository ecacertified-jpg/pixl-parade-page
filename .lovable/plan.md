

# Plan : Ajouter le logging centralise pour `joiedevivre_order_confirmed` et `joiedevivre_order_rejected`

## Resultat du test

- **Template envoye** : `joiedevivre_order_confirmed` accepte par Meta (ID: `wamid...RjUA`)
- **Parametres valides** : 3 body params (`prenom`, `montant`, `nom_business`), pas de header image, pas de bouton CTA dynamique
- **Logging** : 0 entrees dans `whatsapp_template_logs` — le code n'insere rien dans cette table

## Correction

Dans `supabase/functions/handle-order-action/index.ts`, apres l'envoi WhatsApp (ligne 228-229), ajouter un insert dans `whatsapp_template_logs` pour les deux templates (`joiedevivre_order_confirmed` et `joiedevivre_order_rejected`) :

```typescript
// Après ligne 229 (après le log du résultat WhatsApp)
try {
  await supabase.from('whatsapp_template_logs').insert({
    template_name: templateName,
    recipient_phone: customerPhone,
    country_prefix: customerPhone.substring(0, 4),
    whatsapp_message_id: waResult.sid || null,
    status: waResult.success ? 'sent' : 'failed',
    body_params: {
      customer_name: customerFirstName,
      amount: formattedAmount,
      business_name: bizName
    },
    error_message: waResult.error || null,
  });
} catch (logErr) {
  console.error('Failed to log order template:', logErr);
}
```

Ce logging couvre les deux cas (accept/reject) car `templateName` est deja conditionnel.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `supabase/functions/handle-order-action/index.ts` | Ajouter insert `whatsapp_template_logs` apres l'envoi WhatsApp (ligne 229) |

