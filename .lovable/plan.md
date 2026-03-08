

## Plan: Utiliser `sendWhatsAppTemplate` pour `joiedevivre_birthday_no_fund_alert`

Le template Meta est approuve. Il faut remplacer l'envoi en texte libre par l'appel au template HSM dans la fonction `sendNoFundFriendAlert`.

### Modification

**Fichier** : `supabase/functions/birthday-reminder-with-suggestions/index.ts`

**Lignes 496-504** : Remplacer le bloc texte libre par :

1. Ajouter une URL d'image header (meme pattern que le bloc `hasActiveFund` ligne 342) via variable d'env `BIRTHDAY_NO_FUND_ALERT_IMAGE_URL` avec fallback Supabase Storage
2. Remplacer `sendWhatsApp(phone, waMsg)` par `sendWhatsAppTemplate` avec le template `joiedevivre_birthday_no_fund_alert`, 3 parametres body (`contact.name`, `dayLabel`, `'JOIE DE VIVRE'`) et `headerImageUrl`
3. Garder le SMS fallback tel quel pour le canal SMS

```typescript
// Avant
const waMsg = `🎂 L'anniversaire de ${contact.name} est ${dayLabel} !...`;
if (channel === 'whatsapp') {
  sendResult = await sendWhatsApp(phone, waMsg);
} else {
  sendResult = await sendSms(phone, smsMsg);
}

// Apres
const noFundImageUrl = Deno.env.get('BIRTHDAY_NO_FUND_ALERT_IMAGE_URL')
  || `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/assets/birthday-no-fund-alert.jpg`;

if (channel === 'whatsapp') {
  sendResult = await sendWhatsAppTemplate(
    phone,
    'joiedevivre_birthday_no_fund_alert',
    [contact.name, dayLabel, 'JOIE DE VIVRE'],
    [],
    noFundImageUrl
  );
} else {
  sendResult = await sendSms(phone, smsMsg);
}
```

### Memoire
Mettre a jour `.lovable/memory` et `.lovable/plan.md` pour documenter le passage au template HSM.

### Aucune migration DB requise

