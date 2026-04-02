

# Plan : Corriger l'erreur d'insertion du formulaire d'ami et optimiser le chargement

## Probleme 1 : "Une erreur est survenue" apres soumission

**Cause identifiee** : L'utilisateur qui a genere le lien (user_id `b8d0d4e4...`) existe dans `auth.users` mais n'a **pas de profil** dans la table `profiles`. La table `contacts` a une contrainte FK `contacts_user_id_fkey` qui reference `profiles.user_id`. L'insertion echoue avec l'erreur `23503` (foreign key violation).

**Solution** : Dans l'Edge Function `save-friend-form`, avant d'inserer le contact, verifier si le profil de l'inviteur existe. S'il n'existe pas, creer un profil minimal (avec `user_id` et `first_name` extrait de l'email ou vide).

### Fichier : `supabase/functions/save-friend-form/index.ts`

Apres la validation du token (ligne 80), ajouter :

```typescript
// Ensure inviter has a profile (required by contacts FK)
const { data: profile } = await supabaseAdmin
  .from("profiles")
  .select("user_id")
  .eq("user_id", tokenData.user_id)
  .single();

if (!profile) {
  await supabaseAdmin
    .from("profiles")
    .insert({ user_id: tokenData.user_id });
}
```

## Probleme 2 : Lenteur d'ouverture du lien

**Cause** : Le formulaire charge l'ensemble de l'application React (bundle JS complet) avant d'afficher le formulaire. C'est inherent au SPA.

**Optimisation** : Ajouter un lazy loading pour la page `FillFriendForm` dans le routeur, ce qui permet de ne charger que le code necessaire. De plus, reduire le poids du composant en utilisant des imports dynamiques pour `confetti` et `framer-motion` (qui ne sont utiles qu'apres soumission).

### Fichier : `src/App.tsx` (ou fichier de routes)

Remplacer l'import statique par un `React.lazy()` :
```typescript
const FillFriendForm = React.lazy(() => import("@/pages/FillFriendForm"));
```

### Fichier : `src/pages/FillFriendForm.tsx`

Importer `confetti` dynamiquement uniquement lors de la soumission reussie :
```typescript
// Au lieu de: import confetti from "canvas-confetti";
// Importer dynamiquement dans le useEffect:
const { default: confetti } = await import("canvas-confetti");
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/save-friend-form/index.ts` | Auto-creer le profil si absent avant insertion du contact |
| `src/pages/FillFriendForm.tsx` | Import dynamique de confetti et framer-motion |
| Fichier de routes | Lazy load de FillFriendForm |

