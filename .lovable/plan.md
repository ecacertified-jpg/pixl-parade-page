

# Plan : Corriger le crash de `birthday-wishes` et vérifier le flow

## Problème identifié

L'invocation de la Edge Function `birthday-wishes` retourne une **erreur 500** :

```
"supabase.from(...).insert(...).catch is not a function"
```

**Cause** : Le client Supabase JS retourne un `PostgrestFilterBuilder` (pas une `Promise` native) depuis `.insert()`. La méthode `.catch()` n'existe pas dessus. Cela se produit aux **lignes 297 et 366**.

## Solution

Remplacer les 2 appels `.catch(() => {})` par une gestion d'erreur via déstructuration du résultat :

**Ligne 289-297** (dedup pour utilisateurs inscrits) :
```typescript
const { error: dedupError } = await supabase.from('birthday_contact_alerts').insert({
  user_id: profile.user_id || profile.id,
  alert_type: 'birthday_countdown',
  days_before: daysUntil,
  contact_phone: profile.phone || '',
  contact_name: firstName,
  channel: 'whatsapp',
  status: 'sent'
});
if (dedupError) console.warn('Dedup insert error:', dedupError.message);
```

**Ligne 357-366** (dedup pour contacts non-inscrits) — même pattern avec `contact_id`.

## Fichier modifié

- `supabase/functions/birthday-wishes/index.ts` — lignes 289-297 et 357-366

## Résultat attendu

Après correction, la fonction s'exécutera sans crash et les logs confirmeront :
- Envoi de `joiedevivre_birthday_countdown` aux utilisateurs inscrits
- Envoi de `joiedevivre_birthday_countdown_invite` aux contacts non-inscrits
- Envoi de `joiedevivre_birthday_celebration` au jour J

