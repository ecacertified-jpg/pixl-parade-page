

## Plan: Afficher l'email dans l'onglet Contact des paramètres profil

### Modification

**Fichier** : `src/pages/ProfileSettings.tsx`

Dans l'onglet Contact, ajouter un champ email en lecture seule avant le champ téléphone :

- Récupérer l'email via `user?.email` (depuis AuthContext/Supabase Auth)
- Afficher dans un `Input` avec `readOnly` et une icône `Mail`
- Ajouter un texte explicatif : "Pour modifier votre email, rendez-vous dans Méthodes de connexion"
- Style grisé (`bg-muted`) pour indiquer que c'est non-éditable directement

Le champ est en lecture seule car l'email est géré par Supabase Auth, pas par la table profiles.

### Aucune migration SQL, aucun autre fichier modifié.

