
# Correction du formatage des numéros ivoiriens pour les SMS

## Diagnostic

Le SMS n'a pas été envoyé car le numéro de téléphone est mal formaté.

### Erreur identifiée dans les logs

```
notify-contact-added: Sending to +225707*** → ❌ Twilio error
test-sms: Sending to +2250707467445 → ✅ SMS sent successfully
```

### Cause racine

La fonction `formatPhoneForTwilio()` dans `_shared/sms-sender.ts` supprime incorrectement le "0" initial des numéros ivoiriens :

```javascript
// Ligne 54-55 - CODE ACTUEL INCORRECT
if (cleaned.length === 10 && cleaned.startsWith('0')) {
  cleaned = '+225' + cleaned.replace(/^0/, '');  // Résultat: +225707467445 (9 chiffres)
}
```

**Résultat** : `0707467445` → `+225707467445` (9 chiffres après +225)

**Attendu** : `0707467445` → `+2250707467445` (10 chiffres après +225)

### Contexte

Depuis la réforme 2021, les numéros ivoiriens sont passés de 8 à 10 chiffres :
- **Ancien format** : `07 XX XX XX` (8 chiffres) → `+225 07 XX XX XX`
- **Nouveau format** : `07 07 46 74 45` (10 chiffres) → `+225 07 07 46 74 45`

---

## Solution

### Modification de `supabase/functions/_shared/sms-sender.ts`

Corriger la fonction `formatPhoneForTwilio()` pour ne plus supprimer le 0 initial :

```javascript
export function formatPhoneForTwilio(phone: string): string {
  if (!phone) return '';
  
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    // Côte d'Ivoire - 10 chiffres (format post-2021)
    if (cleaned.length === 10 && /^0[157]/.test(cleaned)) {
      cleaned = '+225' + cleaned;  // GARDER le 0
    }
    // Ancien format CI - 8 chiffres (legacy)
    else if (cleaned.length === 8 && /^[0-9]/.test(cleaned)) {
      cleaned = '+225' + cleaned;
    }
    // Sénégal - 9 chiffres (7X XXX XX XX)
    else if (cleaned.length === 9 && /^7/.test(cleaned)) {
      cleaned = '+221' + cleaned;
    }
    // Autre - ajouter +
    else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}
```

### Changements clés

| Avant | Après |
|-------|-------|
| `+225` + `cleaned.replace(/^0/, '')` | `+225` + `cleaned` (garde le 0) |
| Uniquement CI | Ajoute support Sénégal (+221) |

---

## Fichier modifié

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/_shared/sms-sender.ts` | Correction de `formatPhoneForTwilio()` |

---

## Vérification après correction

1. Redéployer les fonctions edge (automatique)
2. Supprimer le contact "Marie Belle"
3. Ré-ajouter avec le numéro `0707467445`
4. Vérifier dans les logs que le numéro envoyé est `+2250707467445`
5. Confirmer la réception du SMS
