

# Plan : Corriger le paramétrage du template `joiedevivre_birthday_reminder` dans `check-birthday-alerts-for-contacts`

## Diagnostic

### Logs actuels
- **2 envois réussis** le 30 mars (après correction du template Meta) — proviennent de `birthday-reminder-with-suggestions` avec les bons paramètres `[destinataire, fêté, jours]`
- **8 échecs** du 13 au 28 mars — erreur `#132001` (template pas encore approuvé dans Meta à cette période), avec seulement 2 paramètres au lieu de 3

### Problème dans `check-birthday-alerts-for-contacts/index.ts`
Ligne 205, les paramètres sont **inversés** :
```
[contact.name, userName, daysUntilBirthday]
```
- `contact.name` = la personne fêtée → envoyé en `{{1}}` (destinataire) ❌
- `userName` = le propriétaire du contact (destinataire) → envoyé en `{{2}}` (fêté) ❌

Le template attend : `{{1}}` = destinataire, `{{2}}` = personne fêtée, `{{3}}` = jours

### Problème de routage WhatsApp
Ligne 195-198, la condition `if (channel === 'sms')` bloque les numéros +225 (Côte d'Ivoire) car `getPreferredChannel` retourne `'sms'` pour ces numéros. Seuls les numéros +229 (Bénin) passent en WhatsApp, ce qui explique les 2 seuls envois réussis.

## Corrections

### 1. Inverser les paramètres (ligne 205)
```typescript
// Avant (INCORRECT)
[contact.name || 'Ami(e)', userName, String(daysUntilBirthday)]

// Après (CORRECT)
[ownerProfile.first_name || 'Ami(e)', contact.name || userName, String(daysUntilBirthday)]
```
Cela nécessite de récupérer `first_name` dans la requête du profil owner (vérifier que c'est déjà le cas).

### 2. Toujours tenter WhatsApp en priorité
Remplacer la condition de routage pour essayer WhatsApp d'abord, puis SMS en fallback — même logique que celle appliquée à `birthday-wishes` :
```typescript
// Toujours tenter WhatsApp en priorité
const waResult = await sendWhatsAppTemplate(...);
if (!waResult.success && channel === 'sms') {
  // Fallback SMS
  sendResult = await sendSms(ownerProfile.phone, message);
}
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Corriger l'ordre des params + routage WhatsApp-first |

