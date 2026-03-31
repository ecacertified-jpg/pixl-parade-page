

# Plan : Rendre les messages d'anniversaire visibles à tous les visiteurs

## Problème

Deux bugs liés :

1. **Messages invisibles pour les visiteurs** : La policy RLS SELECT sur `birthday_wishes_messages` est `birthday_user_id = auth.uid()`. Seul le propriétaire de l'anniversaire peut lire les messages. Les visiteurs (authentifiés ou non) ne voient rien — les messages disparaissent au rechargement.

2. **Nom "Ami(e)" au lieu du vrai prénom** : La requête `profiles` (ligne 176) peut échouer selon les policies RLS, empêchant le fallback `firstName` de fonctionner correctement.

## Solution

### 1. Nouvelle policy RLS SELECT sur `birthday_wishes_messages`

Remplacer la policy restrictive par une policy qui autorise la lecture pour **tout le monde** sur une page d'anniversaire active. Les messages d'anniversaire sont du contenu public par nature (comme un livre d'or).

```sql
-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Birthday user can read their messages" 
  ON public.birthday_wishes_messages;

-- Nouvelle policy : tout utilisateur authentifié peut lire 
-- les messages d'une page anniversaire active
CREATE POLICY "Anyone can read birthday messages on active pages"
  ON public.birthday_wishes_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_id
      AND bp.is_active = true
    )
  );
```

Cela garantit que :
- Tous les visiteurs connectés voient les messages existants
- Les messages persistent entre les rechargements
- L'effet "livre d'or social" encourage les autres à écrire

### 2. Autoriser aussi les visiteurs non authentifiés (anon)

La page d'anniversaire est partagée sur les réseaux sociaux — beaucoup de visiteurs ne sont pas connectés. Il faut qu'ils puissent **voir** les messages même sans compte (l'écriture reste réservée aux authentifiés).

```sql
CREATE POLICY "Anon can read birthday messages on active pages"
  ON public.birthday_wishes_messages
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.birthday_pages bp
      WHERE bp.id = birthday_page_id
      AND bp.is_active = true
    )
  );
```

### 3. Vérifier la policy SELECT sur `profiles` pour le nom

S'assurer que le profil du birthday person est lisible par les visiteurs (policy existante sur `profiles` basée sur `privacy_setting`). Si nécessaire, la requête dans `BirthdayPage.tsx` utilise déjà le fallback via `page.title`.

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| Migration SQL | Remplacer la policy SELECT de `birthday_wishes_messages` par une policy ouverte aux visiteurs |

## Résultat attendu

- Tous les visiteurs (connectés ou non) voient les messages existants sur la page d'anniversaire
- Les messages persistent après rechargement
- L'effet social (voir les messages des autres) encourage les nouveaux visiteurs à écrire
- L'écriture reste protégée (INSERT = authentifié uniquement)

