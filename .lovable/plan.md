## Problème
Postgres retourne `infinite recursion detected in policy for relation "live_rooms"` car :
- La policy SELECT de `live_rooms` fait un `EXISTS` sur `live_participants`
- La policy SELECT de `live_participants` fait un `EXISTS` sur `live_rooms`
Chaque sous-requête re-déclenche l'autre policy → boucle.

## Correction (migration SQL)
Remplacer les deux policies récursives par des appels à des fonctions `SECURITY DEFINER` (pattern recommandé Supabase, déjà utilisé dans le projet pour `has_role`).

1. Créer deux fonctions :
   - `public.is_live_room_member(_room_id uuid, _user_id uuid) returns boolean` — lit `live_participants` sans passer par RLS.
   - `public.is_live_room_host(_room_id uuid, _user_id uuid) returns boolean` — lit `live_rooms` sans passer par RLS.
   Les deux : `language sql stable security definer set search_path = public`.

2. Drop + recreate les policies SELECT :
   - `live_rooms` SELECT : `is_public = true OR auth.uid() = host_id OR public.is_live_room_member(id, auth.uid())`
   - `live_participants` SELECT : `user_id = auth.uid() OR public.is_live_room_host(room_id, auth.uid()) OR EXISTS(... is_public via fonction)` → simplifier en ajoutant `public.is_live_room_public(_room_id)` ou en combinant : `user_id = auth.uid() OR public.is_live_room_host(room_id, auth.uid()) OR public.is_live_room_public(room_id, auth.uid())`.

3. Idem pour la policy ALL `Host can manage participants` sur `live_participants` → utiliser `public.is_live_room_host(room_id, auth.uid())` au lieu d'`EXISTS (SELECT FROM live_rooms ...)`.

Aucun changement côté frontend ni edge function — la migration suffit à débloquer la création de room et le chargement de la liste.

## Vérification
Après migration : recréer une room depuis `/rooms`, vérifier que le toast d'erreur disparaît et que la room s'affiche dans la grille temps réel.