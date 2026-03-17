

# Plan : Ajouter une politique RLS admin sur `user_favorites`

## Probleme

La table `user_favorites` n'a **aucune politique RLS SELECT pour les administrateurs**. Les seules politiques SELECT existantes sont :
- "Users can view their own favorites" — `auth.uid() = user_id`
- "Friends can view favorites" — via `contact_relationships`

Quand un admin ouvre le modal "Souhaits de Gnadjaha", la requête Supabase retourne 0 résultats car l'admin n'est ni Gnadjaha ni son ami dans `contact_relationships`.

## Correction

Ajouter une migration SQL avec une politique RLS SELECT sur `user_favorites` pour les admins actifs, en suivant le pattern identique utilisé sur toutes les autres tables admin du projet :

```sql
CREATE POLICY "Admins can view all favorites"
ON public.user_favorites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);
```

### Fichier modifie

- Nouvelle migration SQL (un seul fichier, une seule instruction)

Aucun changement cote code TypeScript — le composant `AdminWishlistModal` fonctionne deja correctement, il suffit que la base de donnees autorise la lecture.

