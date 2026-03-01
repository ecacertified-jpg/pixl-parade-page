
# Unifier les notifications WhatsApp en un seul template

## Statut : ✅ Implémenté

Le template `joiedevivre_contribution_nudge` n'est plus utilisé. Les deux audiences (contributeurs existants ET amis non-contributeurs) reçoivent désormais le même template `joiedevivre_contribution_update` avec 6 paramètres identiques.

## Modification effectuée

- **Fichier** : `supabase/functions/notify-contribution-progress/index.ts`
- **Changement** : Section 9 (nudge des amis) utilise maintenant `joiedevivre_contribution_update` au lieu de `joiedevivre_contribution_nudge`, avec les 6 mêmes paramètres que la section 8.
