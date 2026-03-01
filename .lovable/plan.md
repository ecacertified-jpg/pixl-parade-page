

# Correction des 2 erreurs dans merge-user-accounts

## Erreur 1 : `column contact_relationships.status does not exist`

**Cause** : Ligne 358, le `select` demande la colonne `status` qui n'existe pas dans la table. Les colonnes reelles sont : `id, user_a, user_b, relationship_type, established_at, can_see_events, can_see_funds, created_at`.

**Correction** : Retirer `status` du select a la ligne 358 et remplacer par les colonnes existantes.

```text
Avant : .select('id, user_a, user_b, status, can_see_birthday, can_see_funds')
Apres : .select('id, user_a, user_b, can_see_funds')
```

`can_see_birthday` n'existe pas non plus (c'est `can_see_events`), mais cette colonne n'est pas utilisee dans la logique de transfert, donc on peut la retirer du select.

---

## Erreur 2 : `stack depth limit exceeded` sur community_scores

**Cause** : Un trigger `update_rankings_after_score_change` se declenche sur chaque UPDATE de `community_scores`. Ce trigger appelle `update_community_rankings()` qui fait un UPDATE sur la meme table, ce qui re-declenche le trigger, causant une recursion infinie.

**Correction** : Au lieu de faire un UPDATE (qui declenche le trigger), supprimer la ligne du secondaire. Le score communautaire est un agrega recalculable ; fusionner deux lignes n'a pas de sens (le primaire garde son propre score).

```text
Avant (lignes 343-347) :
  const { data: communityData, error: communityError } = await supabaseAdmin
    .from('community_scores')
    .update({ user_id: primary_user_id })
    .eq('user_id', secondary_user_id)
    .select();

Apres :
  const { data: communityData, error: communityError } = await supabaseAdmin
    .from('community_scores')
    .delete()
    .eq('user_id', secondary_user_id)
    .select();
```

Le DELETE ne declenche pas le trigger `AFTER INSERT OR UPDATE`, donc pas de recursion.

---

## Fichier modifie

**`supabase/functions/merge-user-accounts/index.ts`** : 2 modifications aux lignes 343-347 et 358.

## Impact

- Supprime les 2 erreurs recurrentes dans les logs
- Aucune modification de schema necessaire
- Le comportement de fusion reste identique pour toutes les autres tables

