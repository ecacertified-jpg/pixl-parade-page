

## Plan: Mettre à jour les URLs `/marketplace` → `/shop`

### Modification
**Fichier** : `supabase/functions/birthday-reminder-with-suggestions/index.ts`

Deux lignes à modifier (lignes 497-498) pour ajouter `/shop` aux URLs dans les messages sans cagnotte :

- **Ligne 497** : `joiedevivre-africa.com` → `joiedevivre-africa.com/shop`
- **Ligne 498** : `joiedevivre-africa.com` → `joiedevivre-africa.com/shop`

Aucun autre fichier à modifier. La fonction sera redéployée automatiquement.

