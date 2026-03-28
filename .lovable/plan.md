

# Plan : Corriger l'erreur d'invitation par telephone

## Probleme

La colonne `invitee_email` dans la table `invitations` est `NOT NULL`. Quand l'onboarding envoie uniquement un numero de telephone (sans email), l'edge function tente d'inserer `invitee_email: null`, ce qui viole la contrainte et provoque une erreur.

## Solution

Modifier la colonne `invitee_email` pour la rendre nullable, puisque l'invitation peut se faire par telephone uniquement.

### 1. Migration SQL

```sql
ALTER TABLE invitations ALTER COLUMN invitee_email DROP NOT NULL;
```

### 2. Aucune modification de code necessaire

L'edge function gere deja le cas `invitee_email: null` (ligne 97). Le code client envoie correctement uniquement le telephone. Seule la contrainte DB bloque.

## Fichiers concernes

| Element | Action |
|---------|--------|
| Table `invitations` | Migration : rendre `invitee_email` nullable |

