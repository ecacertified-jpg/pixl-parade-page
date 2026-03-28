

# Plan : Corriger le lien d'invitation pour pointer vers joiedevivre-africa.com

## Problème

Ligne 182 : `window.location.origin` retourne l'URL de preview Lovable au lieu du domaine de production.

## Solution

Dans `src/components/OnboardingExperience.tsx`, remplacer la ligne 182 :

```tsx
const invitationLink = `${window.location.origin}/auth?invited=true&ref=${data.invitation_id}`;
```

Par :

```tsx
const appBaseUrl = import.meta.env.PROD 
  ? 'https://joiedevivre-africa.com' 
  : window.location.origin;
const invitationLink = `${appBaseUrl}/auth?invited=true&ref=${data.invitation_id}`;
```

## Fichier concerné

| Fichier | Modification |
|---------|-------------|
| `src/components/OnboardingExperience.tsx` (ligne 182) | Domaine de production conditionnel |

