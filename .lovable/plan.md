
## Correction du double envoi SMS+WhatsApp dans notify-contact-added

### Probleme identifie

La fonction `notify-contact-added` envoie SMS et WhatsApp **en parallele** pour les numeros +225 (Cote d'Ivoire) et +221 (Senegal). Le contact recoit donc deux messages identiques a chaque ajout.

Les pays Benin, Togo, Mali et Burkina Faso ne sont pas affectes car leur SMS est marque `unavailable`.

La fonction `process-scheduled-notifications` n'existe pas dans le projet, donc rien a corriger de ce cote.

### Solution

Remplacer la logique d'envoi parallele par un routage **WhatsApp-first avec fallback SMS** :

1. Tenter WhatsApp en premier (template HSM, puis fallback texte libre si echec)
2. Si WhatsApp echoue ET que le SMS est viable pour le pays, envoyer le SMS
3. Si WhatsApp reussit, ne PAS envoyer de SMS
4. Enregistrer un seul log dans `birthday_contact_alerts` avec le canal effectivement utilise

### Fichier modifie

`supabase/functions/notify-contact-added/index.ts`

### Changements techniques

Remplacer les lignes 223-300 (logique d'envoi parallele) par :

```text
// 1. Tenter WhatsApp d'abord (si active)
let finalChannel = 'whatsapp';
let finalSuccess = false;
let finalError: string | undefined;

if (canSendWhatsapp) {
  const waResult = await sendWhatsAppTemplate(...);
  if (waResult.success) {
    finalSuccess = true;
  } else {
    // Template echec, essayer texte libre
    const fallback = await sendWhatsApp(...);
    if (fallback.success) {
      finalSuccess = true;
    } else {
      finalError = fallback.error;
    }
  }
}

// 2. Fallback SMS uniquement si WhatsApp a echoue
if (!finalSuccess && canSendSms) {
  finalChannel = 'sms';
  const smsResult = await sendSms(...);
  finalSuccess = smsResult.success;
  finalError = smsResult.error;
}

// 3. Dernier recours si rien n'etait active
if (!finalSuccess && !canSendWhatsapp && !canSendSms) {
  // Forcer WhatsApp comme avant
  const waResult = await sendWhatsAppTemplate(...);
  ...
}

// 4. Un seul log dans birthday_contact_alerts
await supabaseAdmin.from('birthday_contact_alerts').insert({
  channel: finalChannel,
  status: finalSuccess ? 'sent' : 'failed',
  ...
});
```

### Impact

- Les contacts en Cote d'Ivoire et au Senegal ne recevront plus qu'un seul message (WhatsApp en priorite)
- Le SMS ne sera envoye que si WhatsApp echoue
- Un seul enregistrement par notification dans la table `birthday_contact_alerts` (au lieu de deux)
- Le dashboard de delivrabilite refletera des statistiques plus propres
