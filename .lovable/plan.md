
# Correction du bouton "Ajouter mes amis" dans la carte d'action requise

## Diagnostic

Le bouton "Ajouter mes amis" sur la carte `FriendsCircleReminderCard` ouvre bien le modal `AddFriendModal`, mais l'ami n'est **jamais sauvegardé dans la base de données**.

### Code actuel problématique

```javascript
// FriendsCircleReminderCard.tsx - lignes 71-75
const handleAddFriend = (friend: Friend) => {
  console.log('Friend added:', friend);  // ⚠️ Seulement un log !
  refresh();                              // Rafraîchit le compteur (qui reste à 0)
  onFriendAdded?.();                      // Callback optionnel
};
```

### Code fonctionnel dans Dashboard.tsx

Le Dashboard a une implémentation complète (lignes 251-336) qui :
1. Insère le contact dans la table `contacts`
2. Crée une relation d'amitié si l'utilisateur existe
3. Envoie une notification SMS via `notify-contact-added`
4. Déclenche la vérification des badges

---

## Solution

Ajouter la logique de sauvegarde dans `FriendsCircleReminderCard` en réutilisant le même pattern que Dashboard.

### Modification de `src/components/FriendsCircleReminderCard.tsx`

```text
CHANGEMENTS :
1. Importer supabase et les utilitaires nécessaires
2. Remplacer handleAddFriend par une version qui sauvegarde en BDD
3. Ajouter un état loading et un toast de confirmation
```

**Nouvelle logique handleAddFriend :**

```javascript
const handleAddFriend = async (newFriend: Friend) => {
  if (!user) return;
  
  try {
    // 1. Rechercher si un utilisateur existe avec ce numéro
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', newFriend.phone)
      .maybeSingle();

    // 2. Si l'utilisateur existe, créer une relation d'amitié
    if (existingUser?.user_id && existingUser.user_id !== user.id) {
      await supabase
        .from('contact_relationships')
        .insert({
          user_a: user.id,
          user_b: existingUser.user_id,
          can_see_funds: true,
          relationship_type: 'friend'
        });
    }

    // 3. Créer le contact dans la table contacts
    const { data: insertedContact, error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        name: newFriend.name,
        phone: newFriend.phone,
        relationship: newFriend.relation || newFriend.relationship,
        notes: newFriend.location,
        birthday: newFriend.birthday.toISOString().split('T')[0]
      })
      .select('id')
      .single();

    if (error) throw error;

    // 4. Envoyer notification SMS au contact ajouté
    if (newFriend.phone && insertedContact?.id) {
      supabase.functions.invoke('notify-contact-added', {
        body: {
          contact_id: insertedContact.id,
          contact_name: newFriend.name,
          contact_phone: newFriend.phone,
          birthday: newFriend.birthday.toISOString()
        }
      }).catch(console.error);
    }

    // 5. Rafraîchir le compteur et afficher confirmation
    refresh();
    onFriendAdded?.();
    toast.success(`${newFriend.name} a été ajouté à votre cercle d'amis !`);
    
    // 6. Vérifier les badges
    checkAndAwardBadges(user.id);
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout du contact:', error);
    toast.error('Impossible d\'ajouter le contact');
  }
};
```

---

## Imports à ajouter

```javascript
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
```

---

## Fichier modifié

| Fichier | Action |
|---------|--------|
| `src/components/FriendsCircleReminderCard.tsx` | Modifier handleAddFriend pour sauvegarder en BDD |

---

## Résultat attendu

1. Cliquer sur "Ajouter mes amis" ouvre le modal
2. Remplir le formulaire et valider
3. Le contact est enregistré dans la table `contacts`
4. Le SMS de bienvenue est envoyé au contact
5. Le compteur passe de 1/2 à 2/2
6. Si c'est le 2ème ami, la célébration s'affiche avec confetti
7. Le badge "Premier Cercle" est attribué
