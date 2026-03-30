

# Plan : Corriger le logging OTP dans `whatsapp_template_logs`

## Diagnostic

Le template `joiedevivre_otp` est **correctement envoyé** (100% de delivrabilite dans `whatsapp_otp_codes`), mais **jamais logge** dans `whatsapp_template_logs` (0 entrees).

**Cause** : Ligne 233 de `send-whatsapp-otp/index.ts` insere `template_params: { purpose }` alors que la colonne s'appelle `body_params`. L'insert echoue silencieusement car l'erreur n'est pas verifiee.

## Conformite du template Meta (captures)

- **Header** : Aucun
- **Body** : 1 parametre (le code OTP) — template d'authentification
- **Bouton** : "Copier le code" (bouton URL avec le code en suffixe)
- **Code actuel** : Correct — envoie `body: [{ text: code }]` + `button: [{ text: code }]`

## Correction

Dans `supabase/functions/send-whatsapp-otp/index.ts`, ligne 227-234 :

**Avant** :
```js
await supabaseAdmin.from('whatsapp_template_logs').insert({
  template_name: 'joiedevivre_otp',
  recipient_phone: maskedPhone,
  country_prefix: phone.substring(0, 4),
  whatsapp_message_id: sendResult.messageId,
  status: 'sent',
  template_params: { purpose },  // ❌ colonne inexistante
});
```

**Apres** :
```js
const { error: logError } = await supabaseAdmin.from('whatsapp_template_logs').insert({
  template_name: 'joiedevivre_otp',
  recipient_phone: maskedPhone,
  country_prefix: phone.substring(0, 4),
  whatsapp_message_id: sendResult.messageId,
  status: 'sent',
  body_params: { purpose },  // ✅ colonne correcte
});
if (logError) console.error('Failed to log OTP in template_logs:', logError);
```

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `supabase/functions/send-whatsapp-otp/index.ts` | Renommer `template_params` → `body_params` + ajouter gestion d'erreur |

