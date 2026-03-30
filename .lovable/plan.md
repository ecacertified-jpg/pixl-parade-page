

# Plan : Ajouter le logging centralisé pour `joiedevivre_birthday_create_fund_nudge`

## Résultat du test

- **Template envoyé** : Meta a accepté le message (ID: `wamid...FCDFA`)
- **Paramètres validés** : 4 body params + 1 button param (suffixe `?for=`) + header image
- **Logging** : 0 entrées dans `whatsapp_template_logs` — le code (ligne 532-544) ne logge que dans `birthday_contact_alerts`

## Correction

Dans `supabase/functions/birthday-reminder-with-suggestions/index.ts`, après l'insert dans `birthday_contact_alerts` (ligne 544), ajouter un insert dans `whatsapp_template_logs` pour tracer l'envoi du template `joiedevivre_birthday_create_fund_nudge` :

```typescript
// Après l'insert birthday_contact_alerts (ligne 544)
if (channel === 'whatsapp') {
  const { error: logErr } = await supabase.from('whatsapp_template_logs').insert({
    template_name: 'joiedevivre_birthday_create_fund_nudge',
    recipient_phone: normalizedPhone,
    country_prefix: normalizedPhone.substring(0, 4),
    whatsapp_message_id: sendResult.sid || null,
    status: sendResult.success ? 'sent' : 'failed',
    body_params: {
      contact_name: contact.name,
      days_label: dayLabel,
      recipient: recipientName,
      platform: 'JOIE DE VIVRE'
    },
    error_message: sendResult.error || null,
  });
  if (logErr) console.error('Failed to log create_fund_nudge:', logErr);
}
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Ajouter insert `whatsapp_template_logs` après ligne 544 |

