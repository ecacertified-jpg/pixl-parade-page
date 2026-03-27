

# Plan : Corriger les 3 templates WhatsApp en échec

## Diagnostic

| Template | Erreur Meta | Cause |
|----------|-------------|-------|
| `joiedevivre_birthday_reminder` | `#132001` — Template name does not exist in the translation | Le template n'existe pas dans Meta avec le code langue `fr`, ou a été créé avec `fr_FR` |
| `joiedevivre_contribution_reminder` | `#132001` — Template name does not exist in the translation | Même problème : template absent ou mauvais code langue |
| `joiedevivre_birthday_countdown` | `#132018` — Problème de paramètres | Déjà corrigé (suppression `buttonParameters`). Les 8 échecs datent d'avant le fix. Aucune action nécessaire. |

## Cause racine

L'erreur `#132001` signifie que Meta ne trouve pas ces templates. Deux possibilités :
1. Les templates ont été créés dans Meta avec le code langue `fr_FR` au lieu de `fr`
2. Les templates n'existent pas du tout dans Meta Business Manager

## Actions requises

### Action 1 — Vérification dans Meta (par vous)

Vous devez vérifier dans Meta Business Manager :
- Le template `joiedevivre_birthday_reminder` existe-t-il ? Avec quel code langue ?
- Le template `joiedevivre_contribution_reminder` existe-t-il ? Avec quel code langue ?

Si le code langue est `fr_FR` au lieu de `fr`, nous corrigerons le code. S'ils n'existent pas, je vous fournirai les détails pour les créer.

### Action 2 — Correction du code (après votre retour)

**Fichiers à modifier** :
- `supabase/functions/birthday-reminder-with-suggestions/index.ts` — ligne 298
- `supabase/functions/check-birthday-alerts-for-contacts/index.ts` — ligne 203
- `supabase/functions/check-fund-contribution-reminders/index.ts` — ligne 238

Changement : adapter le code langue `'fr'` → `'fr_FR'` si c'est la cause, ou corriger le nom du template si nécessaire.

### Action 3 — Template countdown (aucune action)

Les 8 échecs de `joiedevivre_birthday_countdown` datent d'avant le fix déployé aujourd'hui. Le code est déjà corrigé. Les prochaines exécutions (CRON) devraient fonctionner.

## Prochaine étape

Pouvez-vous vérifier dans votre Meta Business Manager si `joiedevivre_birthday_reminder` et `joiedevivre_contribution_reminder` existent, et partager une capture d'écran de leurs détails (nom exact, langue, paramètres) ?

