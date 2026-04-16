

# Plan : Améliorer les messages d'erreur du profil

## Problème

Quand la sauvegarde du profil échoue (ligne 80-86 de `CompleteProfileModal.tsx`), le toast affiche un message générique "Impossible de sauvegarder votre profil" sans préciser la cause (ex: champ manquant en base, contrainte RLS, doublon de téléphone, etc.). L'objet `error` de Supabase contient `message`, `code` et `details` mais ils ne sont pas exploités.

## Solution

Mapper les codes d'erreur Supabase courants vers des messages utilisateur clairs en français, et afficher le message brut en fallback.

## Détails techniques

### Fichier : `src/components/CompleteProfileModal.tsx`

Dans le bloc `if (error)` (ligne 80-87), remplacer le message générique par une logique de mapping :

```typescript
if (error) {
  console.error('Error updating profile:', error);
  
  let errorMessage = 'Une erreur est survenue lors de la sauvegarde.';
  
  if (error.code === '23505') {
    errorMessage = 'Ce numéro de téléphone est déjà utilisé par un autre compte.';
  } else if (error.code === '42501') {
    errorMessage = 'Vous n\'avez pas la permission de modifier ce profil. Reconnectez-vous.';
  } else if (error.code === '23502') {
    errorMessage = 'Un champ obligatoire est manquant. Vérifiez vos informations.';
  } else if (error.message) {
    errorMessage = `Erreur : ${error.message}`;
  }
  
  toast({
    title: 'Erreur',
    description: errorMessage,
    variant: 'destructive',
  });
  return;
}
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/CompleteProfileModal.tsx` | Mapper les erreurs Supabase vers des messages explicites |

