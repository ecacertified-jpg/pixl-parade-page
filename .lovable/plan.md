

# Plan : Ajouter le logging centralisé pour `joiedevivre_fund_beneficiary_invite`

## Problème

Dans `notify-business-fund-friends/index.ts` (lignes 252-268), le template `joiedevivre_fund_beneficiary_invite` est envoyé au bénéficiaire mais jamais loggé dans `whatsapp_template_logs`. Il est donc invisible dans le dashboard `/admin/whatsapp-templates`.

## Modification

Dans `notify-business-fund-friends/index.ts`, après ligne 265 (`console.warn`), ajouter un insert dans `whatsapp_template_logs` couvrant succès et échec :

```typescript
// Log beneficiary invite in whatsapp_template_logs
const { error: logErr } = await supabase.from('whatsapp_template_logs').insert({
  template_name: 'joiedevivre_fund_beneficiary_invite',
  recipient_phone: beneficiary_phone.substring(0, beneficiary_phone.length - 4) + '****',
  country_prefix: beneficiary_phone.substring(0, 4),
  whatsapp_message_id: result.messageId || null,
  status: result.success ? 'sent' : 'failed',
  body_params: {
    beneficiary_name: beneficiaryDisplayName,
    creator_name: creatorName,
    product_name: product_name,
    target_amount: formattedTarget
  },
  error_message: result.error || null,
});
if (logErr) console.error('Failed to log fund_beneficiary_invite:', logErr);
```

Ce bloc doit être placé **à l'intérieur** du `try` (après ligne 264), pour couvrir les deux cas (`result.success` true ou false). Le `catch` (ligne 266) ne log pas car on n'a pas de `result`.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-business-fund-friends/index.ts` | Ajouter insert `whatsapp_template_logs` après ligne 264 |

