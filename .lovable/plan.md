

## Plan : Corriger l'affichage des contacts dans les modals Admin

### Problème identifié

La table `contacts` a une politique RLS de lecture limitée à `auth.uid() = user_id` (le propriétaire du contact). Il n'existe **aucune politique SELECT pour les admins**, alors qu'il en existe une pour DELETE. Résultat : les admins ne voient aucun contact dans le `UserProfileModal` (onglet Contacts) ni dans le `BirthdayDetailSheet` (les champs téléphone, email, relation sont vides pour les contacts).

### Correction

#### 1. Migration SQL : Ajouter une politique SELECT admin sur `contacts`

```sql
CREATE POLICY "Admins can view all contacts"
ON public.contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);
```

C'est le même pattern que la politique DELETE admin déjà en place. Une seule migration, pas de changement côté front-end.

### Fichiers concernés
- Nouvelle migration SQL uniquement

