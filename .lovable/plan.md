

# Verification de delivrabilite WhatsApp OTP via webhook Meta

## Probleme

Actuellement, `send-whatsapp-otp` envoie le code et recoit un `message_status: "accepted"` de Meta, mais ne suit pas la livraison reelle. Le webhook Meta recoit deja les callbacks de statut (`sent`, `delivered`, `failed`) et met a jour `whatsapp_template_logs` et `whatsapp_messages`, mais **pas** `whatsapp_otp_codes`. Le `whatsapp_message_id` retourne par Meta n'est meme pas stocke dans la table OTP.

## Architecture de la solution

```text
send-whatsapp-otp                 Meta API               whatsapp-webhook
     |                               |                        |
     |--- POST template ------------>|                        |
     |<-- { message_id: wamid.XX } --|                        |
     |                               |                        |
     | store message_id              |                        |
     | in whatsapp_otp_codes         |                        |
     |                               |--- status: sent ------>|
     |                               |--- status: delivered ->|
     |                               |    or status: failed -->|
     |                               |                        |
     |                               |    update whatsapp_otp_codes
     |                               |    delivery_status = delivered/failed
```

## Etape 1 : Migration -- ajouter colonnes de suivi a whatsapp_otp_codes

```sql
ALTER TABLE whatsapp_otp_codes
  ADD COLUMN whatsapp_message_id TEXT,
  ADD COLUMN delivery_status TEXT DEFAULT 'accepted',
  ADD COLUMN delivered_at TIMESTAMPTZ,
  ADD COLUMN failed_at TIMESTAMPTZ,
  ADD COLUMN delivery_error TEXT;

CREATE INDEX idx_whatsapp_otp_message_id
  ON whatsapp_otp_codes (whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;
```

- `delivery_status` : `accepted` -> `sent` -> `delivered` (ou `failed`)
- L'index permet au webhook de retrouver rapidement l'enregistrement OTP par message ID

## Etape 2 : Modifier send-whatsapp-otp pour capturer le message ID

Dans `supabase/functions/send-whatsapp-otp/index.ts` :

- La fonction `sendWhatsAppMessage` retourne actuellement un `boolean`. Elle retournera desormais `{ success: boolean, messageId?: string }`.
- Apres l'envoi reussi, le `whatsapp_message_id` sera mis a jour dans l'enregistrement `whatsapp_otp_codes` correspondant.

```text
Avant : return true;
Apres : return { success: true, messageId: result.messages?.[0]?.id };
```

Puis dans le handler principal :

```text
const result = await sendWhatsAppMessage(phone, code);
if (result.success && result.messageId) {
  await supabaseAdmin
    .from('whatsapp_otp_codes')
    .update({ whatsapp_message_id: result.messageId })
    .eq('phone', phone)
    .eq('code', code);
}
```

## Etape 3 : Modifier whatsapp-webhook pour mettre a jour les OTP

Dans `supabase/functions/whatsapp-webhook/index.ts`, dans le bloc de traitement des statuts (lignes 225-269), ajouter une 3eme mise a jour pour `whatsapp_otp_codes` :

```text
// 3. Update whatsapp_otp_codes (OTP delivery tracking)
const otpUpdate: Record<string, unknown> = { delivery_status: statusValue };

if (statusValue === 'delivered') {
  otpUpdate.delivered_at = statusTimestamp;
} else if (statusValue === 'failed') {
  otpUpdate.failed_at = statusTimestamp;
  if (errorInfo) {
    otpUpdate.delivery_error = `${errorInfo.code}: ${errorInfo.title}`;
  }
}

await supabase
  .from('whatsapp_otp_codes')
  .update(otpUpdate)
  .eq('whatsapp_message_id', statusId);
```

Ce bloc ne fait rien si le `statusId` ne correspond a aucun OTP (la requete retourne 0 lignes sans erreur).

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Ajout colonnes `whatsapp_message_id`, `delivery_status`, `delivered_at`, `failed_at`, `delivery_error` + index |
| `supabase/functions/send-whatsapp-otp/index.ts` | Capturer et stocker le message ID Meta |
| `supabase/functions/whatsapp-webhook/index.ts` | Ajouter mise a jour OTP dans le traitement des statuts |

## Impact

- Les OTP non livres seront visibles dans les stats admin (`delivery_status = 'failed'`)
- Le dashboard OTP existant pourra etre enrichi avec le taux de delivrabilite reelle (pas juste "accepted")
- Aucun impact sur le flux de verification existant (les colonnes sont optionnelles)
- Compatible avec le health check `check-whatsapp-otp-health` qui pourra utiliser `delivery_status` a l'avenir

