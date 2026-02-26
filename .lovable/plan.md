

## Liaison automatique des contacts a l'inscription

### Objectif

Quand un utilisateur s'inscrit avec un numero de telephone, le systeme verifie automatiquement si ce numero existe dans la table `contacts` d'autres utilisateurs. Si oui, il cree les `contact_relationships` correspondantes et met a jour le `linked_user_id` du contact.

### Approche

Modifier la fonction `handle_new_user()` (trigger sur `auth.users` AFTER INSERT) pour ajouter un bloc supplementaire apres la creation du profil.

### Logique ajoutee dans handle_new_user()

```text
1. Recuperer le phone_number du nouvel utilisateur (deja fait)
2. Si phone_number n'est pas NULL :
   a. Chercher tous les contacts avec un numero correspondant
      (comparaison sur les 8 derniers chiffres, comme dans notify-contact-added)
   b. Pour chaque contact trouve :
      - Mettre a jour contacts.linked_user_id = NEW.id
      - Inserer dans contact_relationships (user_a = contact.user_id, user_b = NEW.id)
        avec ON CONFLICT DO NOTHING (contrainte unique_relationship existante)
        et les permissions can_see_events = true, can_see_funds = true
```

### Normalisation des numeros

La comparaison se fait sur les 8 derniers chiffres (apres suppression des caracteres non-numeriques) pour gerer les variations de format (+225 07..., 07..., etc.).

### Securite

- La fonction est deja `SECURITY DEFINER`, donc elle a les droits necessaires pour ecrire dans `contacts` et `contact_relationships`
- `ON CONFLICT DO NOTHING` evite les doublons si la relation existe deja
- Le bloc est enveloppe dans un `BEGIN ... EXCEPTION` pour ne jamais bloquer l'inscription

### Migration SQL

Un seul fichier de migration qui fait `CREATE OR REPLACE FUNCTION public.handle_new_user()` en reprenant le corps actuel et ajoutant le nouveau bloc apres l'insertion dans `user_reciprocity_preferences`.

### Pas de modification frontend

Tout se passe cote base de donnees, transparent pour l'utilisateur.

