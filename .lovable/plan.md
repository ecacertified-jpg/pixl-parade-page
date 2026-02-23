
# Correction du systeme de lien de partage admin

## Problemes identifies

1. **La regeneration ne desactive pas les anciens codes** : La fonction `regenerate` tente de faire un `UPDATE` pour desactiver l'ancien code, mais la mise a jour echoue silencieusement (probablement un probleme RLS). Resultat : l'admin a **24 codes actifs** au lieu d'un seul.

2. **`maybeSingle()` retourne un code aleatoire** : Avec plusieurs codes actifs, la requete retourne un code quelconque (souvent un code recent sans stats), au lieu du bon.

3. **Les stats sont dispersees** : Les vrais clics/inscriptions/affectations sont sur le code `ADM-YERB`, mais l'UI affiche un autre code avec 0 partout.

4. **L'affectation fonctionne** : L'Edge Function a bien assigne un utilisateur (visible dans les logs et la base de donnees), mais les metriques ne sont pas correctement affichees car le code affiche n'est pas le bon.

## Solution

### Etape 1 : Migration SQL — Nettoyage et contrainte d'unicite

- Desactiver tous les anciens codes sauf le plus recent pour chaque admin
- Ajouter un index unique partiel `(admin_user_id) WHERE is_active = true` pour garantir qu'un seul code actif existe par admin
- Les stats des anciens codes seront aggregees dans le code actif

### Etape 2 : Corriger le hook `useAdminShareCode.ts`

- Dans `loadShareCode`, ajouter `.order('created_at', { ascending: false }).limit(1)` pour toujours prendre le code le plus recent
- Dans `regenerate`, deactiver **tous** les anciens codes de l'admin (pas juste le code courant) via une condition `eq('admin_user_id', adminId)` au lieu de `eq('id', shareCode.id)`

### Etape 3 : Afficher les stats aggregees

- Modifier le hook pour calculer les totaux (clics, inscriptions, affectations) en sommant **tous les codes** de l'admin, pas seulement le code actif actuel
- Cela garantit que meme apres regeneration, les metriques globales restent visibles

## Details techniques

**Migration SQL** :
```sql
-- Desactiver les anciens codes (garder seulement le plus recent par admin)
WITH ranked AS (
  SELECT id, admin_user_id,
    ROW_NUMBER() OVER (PARTITION BY admin_user_id ORDER BY created_at DESC) as rn
  FROM admin_share_codes
  WHERE is_active = true
)
UPDATE admin_share_codes SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Index unique partiel
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_code_per_admin
ON admin_share_codes (admin_user_id) WHERE is_active = true;
```

**Hook `useAdminShareCode.ts`** :
- `loadShareCode` : utiliser `.order('created_at', { ascending: false }).limit(1).maybeSingle()` au lieu de `.maybeSingle()` seul
- `regenerate` : deactiver par `admin_user_id` puis generer
- Ajouter une requete de totaux : `SELECT SUM(clicks_count), SUM(signups_count), SUM(assignments_count)` sur tous les codes de l'admin

**Composant `AdminShareLinkCard.tsx`** :
- Afficher les stats agregees (totaux) au lieu des stats du code actif uniquement
