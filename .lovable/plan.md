

## Plan: Afficher les contacts d'un utilisateur dans le profil admin

### Contexte
Le `UserProfileModal` (modal admin pour voir le profil d'un utilisateur) a actuellement 2 onglets : "Informations" et "Statistiques". On ajoute un 3e onglet **"Contacts"** listant les amis/contacts ajoutés par cet utilisateur.

### Modification unique : `src/components/admin/UserProfileModal.tsx`

1. **Ajouter un 3e onglet** "Contacts" dans le `TabsList` (passer de `grid-cols-2` à `grid-cols-3`)

2. **Fetcher les contacts** au chargement du modal :
```sql
SELECT id, name, phone, email, birthday, relationship, avatar_url
FROM contacts WHERE user_id = :userId
ORDER BY name ASC
```

3. **Afficher dans `TabsContent "contacts"`** :
   - Nombre total de contacts en badge
   - Liste scrollable de cartes compactes, chacune montrant :
     - Avatar + nom
     - Badge relation coloré (Famille, Ami, Collègue, etc.) — réutiliser le mapping `RELATIONSHIP_LABELS` existant dans `BirthdayDetailSheet`
     - Téléphone (icône Phone)
     - Email (icône Mail)
     - Date d'anniversaire (icône Cake)
   - Message d'état vide si aucun contact

### Aucune migration SQL nécessaire
La table `contacts` est accessible aux admins via les policies RLS existantes. Aucun autre fichier modifié.

