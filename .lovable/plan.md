
# Routage intelligent des notifications par pays du contact

## Probleme actuel

La Edge Function `notify-contact-added` envoie systematiquement sur les deux canaux (SMS + WhatsApp) sans tenir compte du pays du destinataire. Resultat :

| Pays du contact | SMS | WhatsApp | Probleme |
|----------------|-----|----------|----------|
| CI (+225) | Fonctionne | Fonctionne | Aucun |
| SN (+221) | Instable | Fonctionne | SMS parfois echoue |
| BJ (+229) | Echoue | Fonctionne | Appel Twilio inutile |
| TG (+228) | Echoue | Fonctionne | Appel Twilio inutile |
| ML (+223) | Echoue | Fonctionne | Appel Twilio inutile |
| BF (+226) | Echoue | Fonctionne | Appel Twilio inutile |

## Solution proposee

Ajouter un routage par prefixe telephonique dans la Edge Function pour determiner si le SMS est viable avant de l'envoyer.

## Modifications

### 1. `supabase/functions/notify-contact-added/index.ts`

Ajouter une map de fiabilite SMS par prefixe telephonique (reprenant la logique de `countries.ts` cote serveur) :

```text
+225 (CI) -> SMS fiable, envoyer SMS + WhatsApp
+221 (SN) -> SMS instable, envoyer WhatsApp prioritaire + SMS en option
+229 (BJ) -> SMS indisponible, envoyer WhatsApp uniquement
+228 (TG) -> SMS indisponible, envoyer WhatsApp uniquement
+223 (ML) -> SMS indisponible, envoyer WhatsApp uniquement
+226 (BF) -> SMS indisponible, envoyer WhatsApp uniquement
```

La logique sera :
- Extraire le prefixe du numero de telephone du contact
- Consulter la map pour determiner `smsReliability`
- Si `unavailable` : ne pas tenter le SMS, envoyer uniquement WhatsApp
- Si `unreliable` avec `smsActuallyReliable: true` (CI) : envoyer les deux
- Si `unreliable` sans flag : envoyer WhatsApp en priorite, SMS en option
- Si `reliable` : envoyer les deux

### 2. Details techniques

Ajouter en haut de la Edge Function :

```typescript
const SMS_RELIABILITY_BY_PREFIX: Record<string, { reliability: string; smsActuallyReliable?: boolean }> = {
  '225': { reliability: 'unreliable', smsActuallyReliable: true },
  '221': { reliability: 'unreliable' },
  '229': { reliability: 'unavailable' },
  '228': { reliability: 'unavailable' },
  '223': { reliability: 'unavailable' },
  '226': { reliability: 'unavailable' },
};

function getSmsPrefixReliability(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  for (const [prefix, config] of Object.entries(SMS_RELIABILITY_BY_PREFIX)) {
    if (cleaned.startsWith(prefix)) {
      if (config.reliability === 'unreliable' && config.smsActuallyReliable) return 'reliable';
      return config.reliability;
    }
  }
  return 'reliable'; // default
}
```

Puis modifier la section d'envoi (ligne ~205) :

```typescript
const smsReliability = getSmsPrefixReliability(contact_phone);

if (preferences.sms_enabled && smsReliability !== 'unavailable') {
  sendPromises.push(
    sendSms(contact_phone, smsMessage).then(...)
  );
}
if (preferences.whatsapp_enabled) {
  sendPromises.push(
    sendWhatsAppTemplate(...).then(...)
  );
}

// Si aucun canal n'est actif apres filtrage, forcer WhatsApp
if (sendPromises.length === 0) {
  sendPromises.push(
    sendWhatsAppTemplate(...).then(...)
  );
}
```

### 3. Logs ameliores

Ajouter un log indiquant le routage choisi :

```typescript
console.log(`Routing for ${contact_phone}: smsReliability=${smsReliability}, sms=${preferences.sms_enabled && smsReliability !== 'unavailable'}, whatsapp=${preferences.whatsapp_enabled}`);
```

## Resultat attendu

- Les contacts au Benin, Togo, Mali et Burkina Faso recoivent uniquement un WhatsApp (pas de tentative SMS vouee a l'echec)
- Les contacts en Cote d'Ivoire recoivent SMS + WhatsApp
- Les contacts au Senegal recoivent WhatsApp en priorite
- Reduction des appels API Twilio inutiles et des logs d'erreur
