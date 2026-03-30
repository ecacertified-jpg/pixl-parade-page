

# Plan : Ajouter le logging centralisé pour `joiedevivre_birthday_friend_alert`

## Problème

La fonction `birthday-reminder-with-suggestions/index.ts` envoie correctement le template WhatsApp mais ne l'enregistre que dans `birthday_contact_alerts`. Il manque l'insert dans `whatsapp_template_logs`, ce qui rend le template invisible dans le dashboard de monitoring `/admin/whatsapp-templates`.

## Correction

Dans `supabase/functions/birthday-reminder-with-suggestions/index.ts`, après l'envoi WhatsApp réussi (ligne 387), ajouter un insert dans `whatsapp_template_logs` :

```typescript
// Après sendWhatsAppTemplate (ligne 387)
const { error: logErr } = await supabase.from('whatsapp_template_logs').insert({
  template_name: 'joiedevivre_birthday_friend_alert',
  recipient_phone: normalizedPhone,
  country_prefix: normalizedPhone.substring(0, 4),
  whatsapp_message_id: sendResult.sid || null,
  status: sendResult.success ? 'sent' : 'failed',
  body_params: {
    contact_name: contact.name,
    days: daysUntilBirthday,
    creator: creatorName,
    target_amount: activeFund.target_amount
  },
  error_message: sendResult.error || null,
});
if (logErr) console.error('Failed to log birthday_friend_alert:', logErr);
```

Ce logging doit couvrir les **deux cas** :
1. Template WhatsApp réussi
2. Template WhatsApp échoué (pour tracer les erreurs)

Le fallback SMS/free-text n'a pas besoin d'être loggé ici (il utilise un canal différent).

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Ajouter insert `whatsapp_template_logs` après l'envoi du template |

