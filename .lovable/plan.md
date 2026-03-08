

## Diagnostic

J'ai inspecte la base de donnees :
- **Aucune `contact_request`** n'existe de votre compte vers Amtey Benin (user `5144d277`)
- **Aucun contact** "Amtey Benin" n'a ete cree dans votre cercle d'amis
- L'insertion dans `contact_requests` a echoue silencieusement, donc `sendRequest` a retourne `false`, et l'insertion du contact n'a jamais ete executee (elle depend du succes de la demande)

### Cause racine : Bug dans la politique RLS de `contact_requests`

La politique INSERT contient une erreur critique :

```sql
-- Actuel (BUGUE) :
contact_requests_1.target_id = contact_requests_1.target_id
-- Compare la colonne a elle-meme → toujours true !

-- Correct :
contact_requests_1.target_id = target_id  
-- Compare a la valeur du nouveau row
```

Ce bug fait que des qu'un utilisateur a UNE demande pending non-expiree vers N'IMPORTE QUI, TOUTES les nouvelles demandes sont bloquees. Bien que votre compte n'ait actuellement aucune demande, ce bug reste un probleme latent qui peut bloquer les insertions dans certains cas de race condition ou de cache RLS.

### Deuxieme probleme : le contact n'est cree que si la demande reussit

Le code actuel fait : `if (ok) { insert contact }`. Si `sendRequest` echoue pour quelque raison que ce soit, le contact n'est jamais cree. De plus, aucun message d'erreur n'est affiche a l'utilisateur quand l'insertion du contact echoue.

## Plan de correction

### 1. Migration SQL : corriger la politique RLS

```sql
DROP POLICY "Users can create contact requests" ON contact_requests;
CREATE POLICY "Users can create contact requests" ON contact_requests
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = requester_id 
  AND requester_id <> target_id
  AND NOT EXISTS (
    SELECT 1 FROM contact_requests cr
    WHERE cr.requester_id = auth.uid()
    AND cr.target_id = contact_requests.target_id
    AND cr.status = 'pending'
    AND cr.expires_at > now()
  )
);
```

### 2. `src/components/UserSuggestionsSection.tsx`

Ameliorer `handleAddFriend` :
- Ajouter un `toast.error()` si l'insertion du contact echoue
- Creer le contact meme si `sendRequest` echoue (l'ajout au cercle d'amis et la demande sont deux actions independantes)
- Ajouter un log console pour le debug

```typescript
const handleAddFriend = async (suggestion) => {
  setActionLoading(`friend-${suggestion.user_id}`);
  try {
    // Send friend request (independent)
    await sendRequest(suggestion.user_id);

    // Always try to add to contacts circle
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles').select('phone, birthday, city')
        .eq('user_id', suggestion.user_id).single();

      const name = [suggestion.first_name, suggestion.last_name]
        .filter(Boolean).join(' ') || 'Utilisateur';

      const { error } = await supabase.from('contacts').insert({
        user_id: user.id, name,
        phone: profile?.phone || null,
        birthday: profile?.birthday || null,
        relationship: 'ami',
        linked_user_id: suggestion.user_id,
        notes: profile?.city || suggestion.city || null,
      });

      if (error) {
        console.error('Contact insert error:', error);
        if (error.code !== '23505') {
          toast.error("Impossible d'ajouter le contact");
        }
      }

      setFriendRequestSent(prev => new Set(prev).add(suggestion.user_id));
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
    }
  } catch (error) {
    console.error('Error adding friend:', error);
    toast.error("Une erreur est survenue");
  } finally {
    setActionLoading(null);
  }
};
```

### Fichiers concernes
- Migration SQL (politique RLS `contact_requests`)
- `src/components/UserSuggestionsSection.tsx`

