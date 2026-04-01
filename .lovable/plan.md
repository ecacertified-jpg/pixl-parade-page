

# Plan : Auto-créer la page d'anniversaire lors de la création d'une cagnotte self-fund

## Problème

La bannière ne s'affiche pas car la requête dans Dashboard cherche une entrée dans `birthday_pages` pour l'année en cours, mais créer une cagnotte self-fund ne crée pas automatiquement cette entrée. Elle n'est créée que pendant l'onboarding.

## Solution

### 1. Créer la birthday page automatiquement dans Dashboard.tsx

Modifier le `useEffect` qui fetch le slug (lignes 207-226) :
- Si aucune `birthday_pages` n'existe pour l'utilisateur cette année, en créer une automatiquement avec un slug généré à partir du prénom
- Utiliser la même logique de génération de slug que dans `OnboardingExperience.tsx`
- Après insertion, setter `birthdayPageSlug` avec le nouveau slug

### 2. Logique de création

```text
1. Fetch birthday_pages pour user + année courante
2. Si existe → utiliser le slug
3. Si n'existe pas → générer slug depuis prénom
   → INSERT dans birthday_pages
   → setter birthdayPageSlug
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/Dashboard.tsx` | Modifier le useEffect pour auto-créer la birthday page si absente |

