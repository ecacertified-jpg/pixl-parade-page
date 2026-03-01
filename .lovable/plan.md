

# Corriger la validation des messages de gratitude

## Probleme

La regex de validation dans `AddGratitudeModal.tsx` (ligne 33) rejette les messages contenant des emojis et caracteres speciaux :

```typescript
.regex(/^[\w\s\p{P}\p{Emoji}]+$/u, "Le message contient des caractères non autorisés")
```

Cette regex est trop restrictive. Ironiquement, les suggestions pre-remplies par l'application elle-meme contiennent des emojis et sont donc rejetees par la validation.

## Solution

Remplacer la regex restrictive par une approche permissive : au lieu de lister les caracteres autorises (allowlist), bloquer uniquement les caracteres dangereux (denylist). Concretement, supprimer la contrainte `.regex(...)` et garder uniquement les validations `.min(10)` et `.max(500)` qui sont suffisantes. La protection contre les injections est deja assuree cote serveur par Supabase (requetes parametrees via le SDK).

## Fichier a modifier

**`src/components/AddGratitudeModal.tsx`** - Ligne 33

Supprimer la ligne :
```typescript
.regex(/^[\w\s\p{P}\p{Emoji}]+$/u, "Le message contient des caractères non autorisés")
```

Le schema devient :
```typescript
const gratitudeSchema = z.object({
  message: z.string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(500, "Le message ne peut pas dépasser 500 caractères"),
  fundId: z.string().uuid("Identifiant de cagnotte invalide"),
  beneficiaryId: z.string().uuid("Identifiant du bénéficiaire invalide"),
});
```

## Pourquoi c'est sur

- Les requetes Supabase utilisent des parametres lies (pas de concatenation SQL)
- Le contenu est du texte libre affiche dans l'UI (pas interprete comme HTML/JS)
- Les contraintes de longueur (min 10, max 500) restent en place
