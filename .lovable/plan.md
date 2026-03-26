

# Plan : Déclencher les alertes anniversaire à J-15 au lieu de J-7

## Problème

Les deux blocs d'alerte WhatsApp dans `birthday-reminder-with-suggestions/index.ts` utilisent `daysUntilBirthday <= 7` comme condition. Cela ne laisse que 7 jours aux proches pour organiser ou contribuer à une cagnotte.

## Changement — `supabase/functions/birthday-reminder-with-suggestions/index.ts`

Deux modifications de condition :

1. **Ligne 322** : `if (hasActiveFund && daysUntilBirthday <= 7)` → `daysUntilBirthday <= 15`
2. **Ligne 467** : `else if (!hasActiveFund && daysUntilBirthday <= 7)` → `daysUntilBirthday <= 15`

La déduplication existante via `birthday_contact_alerts` empêche déjà les envois multiples pour le même contact/jour.

## Fichier modifié

- `supabase/functions/birthday-reminder-with-suggestions/index.ts`

