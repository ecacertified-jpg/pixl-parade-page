

# Plan : Modale "Bienvenue" uniquement pour Google Auth + champ Prenom

## Analyse

Le formulaire d'inscription par **telephone** et **email** collecte deja : prenom, anniversaire, ville, telephone. Ces donnees sont sauvegardees dans le profil via le trigger `handle_new_user` (user_metadata). La modale "Bienvenue" re-demande les memes infos — inutile et frustrant.

Pour **Google Auth**, seul le prenom (via Google) est disponible. L'anniversaire, la ville et le telephone manquent. La modale est donc pertinente uniquement pour ces utilisateurs.

## Modifications

### 1. `src/hooks/useProfileCompletion.ts` — Detecter le provider

Ajouter une verification du provider d'authentification. Si l'utilisateur s'est inscrit via phone ou email, ne pas afficher la modale (les donnees sont deja collectees dans le formulaire d'inscription). Seuls les utilisateurs Google Auth verront la modale si des champs manquent.

```ts
// Detecter si l'utilisateur est Google Auth
const isGoogleAuth = user.app_metadata?.provider === 'google' || 
  user.identities?.some(i => i.provider === 'google');

// Pour phone/email: ne pas montrer la modale (donnees collectees a l'inscription)
if (!isGoogleAuth) {
  return { needsCompletion: false, isGoogleUser: false, initialData: {} };
}

// Pour Google Auth: verifier si birthday/city/phone manquent + first_name
return { needsCompletion: incomplete, isGoogleUser: true, initialData: { ... } };
```

### 2. `src/components/CompleteProfileModal.tsx` — Ajouter le champ Prenom

Ajouter un champ "Prenom" en premiere position dans le formulaire, pre-rempli depuis `initialData.firstName` (Google full_name). Mettre a jour la validation (4 champs au lieu de 3), la barre de progression, et inclure `first_name` dans le `updateData` envoye a Supabase.

### 3. `src/pages/Dashboard.tsx` — Passer `isGoogleUser` si necessaire

Adapter le passage de props pour `CompleteProfileModal` si le hook expose une nouvelle propriete.

## Fichiers impactes

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useProfileCompletion.ts` | Filtrer par provider, exposer `isGoogleUser` |
| `src/components/CompleteProfileModal.tsx` | Ajouter champ Prenom, maj progress 4 etapes |
| `src/pages/Dashboard.tsx` | Ajustement mineur si needed |

