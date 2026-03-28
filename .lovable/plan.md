

# Plan : Corriger le lien d'invitation pour pointer vers joiedevivre-africa.com

## Problème

Ligne 182 de `OnboardingExperience.tsx` :
```tsx
const invitationLink = `${window.location.origin}/auth?invited=true&ref=${data.invitation_id}`;
```
`window.location.origin` retourne l'URL de preview Lovable (`https://...lovableproject.com`) au lieu du domaine de production.

## Solution

Remplacer `window.location.origin` par le domaine de production hardcodé, avec fallback sur `window.location.origin` en développement :

```tsx
const appBaseUrl = import.meta.env.PROD 
  ? 'https://joiedevivre-africa.com' 
  : window.location.origin;
const invitationLink = `${appBaseUrl}/auth?invited=true&ref=${data.invitation_id}`;
```

Cela garantit que les liens partagés pointent toujours vers le domaine de production, tout en gardant le fonctionnement local pour le développement.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Remplacer `window.location.origin` par le domaine de production |

