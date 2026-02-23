
# Lien de partage admin : choix Client / Prestataire et redirection vers le bon onglet

## Contexte actuel

- La page `JoinAdmin` (`/join/:code`) redirige toujours vers `/auth` (inscription client), sans offrir l'option de s'inscrire comme prestataire.
- Les dates d'inscription sont deja affichees dans les deux onglets de "Mes affectations".
- Le `BusinessAuth` gere deja correctement `admin_ref` via `sessionStorage` et appelle `processAdminAutoAssign(userId, 'business')`.

## Modifications

### 1. Transformer JoinAdmin en page d'accueil avec choix

Modifier `src/pages/JoinAdmin.tsx` pour afficher une page de selection quand l'utilisateur n'est pas connecte, avec deux boutons :

- **"Je suis un client"** : redirige vers `/auth?admin_ref=CODE`
- **"Je suis un prestataire"** : redirige vers `/business-auth?admin_ref=CODE`

Si l'utilisateur est deja connecte, le comportement actuel est conserve (affectation immediate + redirection).

### 2. Gerer `admin_ref` dans BusinessAuth via URL

Modifier `src/pages/BusinessAuth.tsx` pour lire `admin_ref` depuis les parametres URL (en plus du `sessionStorage` deja gere par `processAdminAutoAssign`).

Ajouter dans le `useEffect` de redirection des utilisateurs deja connectes :
```
const adminRef = searchParams.get('admin_ref') || sessionStorage.getItem('jdv_admin_ref');
if (adminRef) {
  sessionStorage.setItem('jdv_admin_ref', adminRef);
  await processAdminAutoAssign(user.id, 'business');
}
```

### 3. Design de la page JoinAdmin

La page affichera :
- Le logo / titre JOIE DE VIVRE
- Un message de bienvenue ("Vous avez ete invite a rejoindre JOIE DE VIVRE")
- Deux cartes de selection :
  - **Client** : icone User, description "Offrez des cadeaux a vos proches"
  - **Prestataire** : icone Store, description "Vendez vos produits sur la plateforme"
- Le code admin reste stocke dans `sessionStorage` pour etre traite apres l'inscription

## Details techniques

| Fichier | Changement |
|---------|-----------|
| `src/pages/JoinAdmin.tsx` | Ajouter page de choix client/prestataire au lieu de rediriger directement vers `/auth` |
| `src/pages/BusinessAuth.tsx` | Lire `admin_ref` depuis l'URL et stocker dans sessionStorage + traiter l'auto-assign pour les utilisateurs deja connectes |
