

# Plan : Tester le template `joiedevivre_refund_alert` et ajouter le logging

## Analyse du template Meta (captures)

- **Header** : Aucun
- **Body** : 1 variable — `{{1}}` = ID court de la commande
- **Footer** : JOIE DE VIVRE
- **Bouton CTA** : "Gérer la demande" — URL **statique** `https://joiedevivre-africa.com/business-account?tab=orders`
- **Pas de `button_params`** (URL statique, pas dynamique)

## Verification du code

Le code dans `notify-order-confirmation/index.ts` (ligne 136-141) envoie correctement :
- `body_params: [shortOrderId]` (1 param)
- Pas de `button_params` (bouton statique)
- Pas de `header_image_url`

**Probleme** : Aucun insert dans `whatsapp_template_logs` apres l'envoi. Le template est invisible dans le dashboard de monitoring.

## Etapes

### 1. Tester le template via `test-whatsapp-send`

Envoyer au numero verifie `+2250708895257` :
- `template`: `joiedevivre_refund_alert`
- `body_params`: `["81973980"]`
- Pas de `header_image_url`, pas de `button_params`

### 2. Ajouter le logging centralise

Dans `notify-order-confirmation/index.ts`, apres ligne 149 (`smsSent = sendResult.success`), ajouter :

```typescript
// Log refund alert in whatsapp_template_logs
if (channel === 'whatsapp') {
  const { error: logErr } = await supabase.from('whatsapp_template_logs').insert({
    template_name: 'joiedevivre_refund_alert',
    recipient_phone: businessPhone,
    country_prefix: businessPhone.substring(0, 4),
    whatsapp_message_id: sendResult.sid || null,
    status: sendResult.success ? 'sent' : 'failed',
    body_params: { order_id: shortOrderId },
    error_message: sendResult.error || null,
  });
  if (logErr) console.error('Failed to log refund_alert:', logErr);
}
```

### 3. Deployer et verifier

Redeployer la fonction `notify-order-confirmation` puis confirmer le deploiement.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-order-confirmation/index.ts` | Ajouter insert `whatsapp_template_logs` apres ligne 149 |

