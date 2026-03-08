

## Plan : Créer un contact dans le cercle d'amis lors du clic sur "Ami" dans le carrousel de suggestions

### Contexte
Actuellement, le bouton "Ami" sur les cartes du carrousel de suggestions envoie uniquement une `contact_request`. Le contact n'apparait pas dans le cercle d'amis (table `contacts`) tant qu'il n'est pas ajouté manuellement via le formulaire "Ajouter un ami".

### Modification

#### 1. `src/components/UserSuggestionsSection.tsx`

Quand le bouton "Ami" est cliqué et la demande envoyée avec succès :
- Fetcher le profil complet de l'utilisateur suggéré (`phone`, `birthday`, `city`) depuis la table `profiles`
- Insérer un contact dans la table `contacts` avec :
  - `user_id` = utilisateur courant
  - `name` = `first_name + last_name` de la suggestion
  - `phone` = téléphone du profil (si disponible)
  - `birthday` = anniversaire du profil (si disponible)
  - `relationship` = `'ami'`
  - `linked_user_id` = `suggestion.user_id`
  - `notes` = ville (si disponible)
- Invalider le cache React Query des contacts du dashboard

#### 2. `src/hooks/useFriendRequests.ts`

Ajouter une fonction `sendRequestAndAddContact` qui :
1. Appelle `sendRequest` existant
2. Si succès, fetch le profil cible et insère dans `contacts`
3. Crée aussi la `contact_relationship` symétrique
4. Retourne le résultat

Alternativement, cette logique peut rester dans le composant `UserSuggestionsSection` pour éviter de modifier le hook partagé.

### Approche retenue
Logique directement dans `UserSuggestionsSection.tsx` pour isoler le changement. Le handler du bouton "Ami" sera enrichi pour :

```typescript
const handleAddFriend = async (suggestion: UserSuggestion) => {
  setActionLoading(`friend-${suggestion.user_id}`);
  const ok = await sendRequest(suggestion.user_id);
  if (ok && user?.id) {
    // Fetch full profile for phone/birthday
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, birthday, city')
      .eq('user_id', suggestion.user_id)
      .single();

    const name = [suggestion.first_name, suggestion.last_name].filter(Boolean).join(' ') || 'Utilisateur';

    // Insert contact
    await supabase.from('contacts').insert({
      user_id: user.id,
      name,
      phone: profile?.phone || null,
      birthday: profile?.birthday || null,
      relationship: 'ami',
      linked_user_id: suggestion.user_id,
      notes: profile?.city || suggestion.city || null,
    });

    setFriendRequestSent(prev => new Set(prev).add(suggestion.user_id));
  }
  setActionLoading(null);
};
```

Ce handler remplacera le handler inline actuel des boutons "Ami" (mobile et desktop).

### Fichiers concernés
- `src/components/UserSuggestionsSection.tsx`

