
Plan : Corriger l’erreur d’envoi depuis un lien d’anniversaire partagé

- Le vrai problème n’est probablement pas WhatsApp lui-même.
- Le lien partagé amène souvent un visiteur externe qui crée/se connecte à son compte, puis essaie d’envoyer un message.
- Dans `src/pages/BirthdayPage.tsx`, l’envoi fait actuellement :
  - un `insert(...)`
  - puis `.select().single()`
- Or la table `birthday_wishes_messages` a une policy RLS qui :
  - autorise l’`INSERT` aux utilisateurs authentifiés
  - n’autorise le `SELECT` qu’à la personne dont c’est l’anniversaire
- Résultat : l’insertion peut réussir, mais la lecture immédiate de la ligne insérée échoue pour l’ami qui vient d’écrire le message.

## Correction proposée

### 1. Corriger l’insert côté front
Dans `src/pages/BirthdayPage.tsx` :
- retirer `.select().single()` après l’`insert`
- garder seulement l’insert
- si l’insert réussit, ajouter localement le message dans l’état React avec un objet construit côté client
- conserver un toast de succès clair

Cela évite de relire une ligne que l’expéditeur n’a pas le droit de consulter.

### 2. Sécuriser la récupération du profil expéditeur
Toujours dans `BirthdayPage.tsx` :
- remplacer le `.single()` sur `profiles` par `.maybeSingle()` pour éviter une erreur si le profil est incomplet ou absent
- prévoir un fallback propre pour `senderName`

### 3. Fiabiliser le retour après connexion
Le lien vers `/auth` est aujourd’hui construit ainsi :
```ts
/auth?redirect=/birthday/${slug}&invited=true
```
Ce format casse le paramètre `redirect` car `&invited=true` devient un paramètre séparé.

Je propose de :
- encoder le redirect :
```ts
/auth?redirect=${encodeURIComponent(`/birthday/${slug}?invited=true`)}
```
ou
```ts
/auth?redirect=${encodeURIComponent(`/birthday/${slug}`)}&invited=true
```
- utiliser le même format partout dans la page anniversaire et l’album

But : après connexion depuis un lien partagé, l’utilisateur revient de façon fiable sur la bonne page.

## Fichiers concernés

| Fichier | Action |
|---|---|
| `src/pages/BirthdayPage.tsx` | Retirer `.select().single()` après insert, construire le message localement, utiliser `.maybeSingle()` pour le profil |
| `src/components/BirthdayAlbum.tsx` | Harmoniser l’URL de redirection vers `/auth` |
| éventuellement `src/pages/Auth.tsx` | Vérifier que `redirect` est bien consommé même quand des query params sont encodés |

## Détail technique
Le schéma actuel confirme la cause :
- policy `INSERT` :
```sql
CREATE POLICY "Authenticated users can insert messages"
ON public.birthday_wishes_messages FOR INSERT
TO authenticated
WITH CHECK (true);
```
- policy `SELECT` :
```sql
CREATE POLICY "Birthday user can read their messages"
ON public.birthday_wishes_messages FOR SELECT
TO authenticated
USING (birthday_user_id = auth.uid());
```

Donc :
```text
ami connecté -> INSERT autorisé
ami connecté -> SELECT de retour interdit
=> erreur à l’envoi si le code demande la ligne insérée
```

## Résultat attendu
Après correction :
- un visiteur venant de WhatsApp peut se connecter puis envoyer son message
- le message part sans erreur
- l’interface affiche immédiatement le nouveau message
- la page anniversaire reste émotionnelle et fluide, sans exposer d’erreur technique
