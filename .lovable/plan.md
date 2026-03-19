

# Plan : Corriger l'erreur de soumission du formulaire ami

## Problème

La table `contacts` ne possède **pas** les colonnes `city`, `neighborhood`, `location`, `latitude`, `longitude`. L'Edge Function `save-friend-form` tente d'insérer ces champs dans `contacts`, ce qui provoque une erreur SQL silencieuse.

Ces colonnes existent sur la table `profiles`, pas sur `contacts`.

## Solution

**Ajouter les colonnes manquantes** à la table `contacts` via une migration SQL :

```sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
```

## Fichier modifié

- Nouvelle migration SQL (ajout des 5 colonnes à `contacts`)

Aucune modification du code TypeScript n'est nécessaire — l'Edge Function et le formulaire sont déjà corrects, il manquait juste les colonnes en base.

