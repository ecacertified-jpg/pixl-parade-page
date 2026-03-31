

# Plan : Messages viraux pour le partage de la page anniversaire

## Problème

Quand l'utilisateur copie le lien ou le partage, le message d'accompagnement est soit absent (copier le lien = URL nue), soit trop générique. Résultat : un lien froid dans WhatsApp qui n'incite personne à cliquer.

## Solution

Rendre **tous** les points de partage viraux avec un message émotionnel et personnalisé qui accompagne le lien.

### 1. `BirthdayPageShareButton.tsx` — Messages viraux par plateforme

Réécrire `shareText` avec un message bien plus engageant, émotionnel et viral :

```typescript
const shareText = age
  ? `🎂🎉 ${firstName} fête ses ${age} ans !\n\nSon anniversaire approche et tu peux lui faire plaisir en 30 secondes :\n👉 Écris-lui un petit mot\n👉 Ajoute une photo souvenir\n👉 Participe au cadeau collectif\n\nClique ici, ça prend 30 secondes ⬇️`
  : `🎂🎉 C'est l'anniversaire de ${firstName} !\n\nTu peux lui faire plaisir en 30 secondes :\n👉 Écris-lui un petit mot\n👉 Ajoute une photo souvenir\n👉 Participe au cadeau collectif\n\nClique ici, ça prend 30 secondes ⬇️`;
```

**"Copier le lien"** : copier le **message complet + URL** au lieu de l'URL seule :
```typescript
// Avant
await navigator.clipboard.writeText(pageUrl);

// Après
await navigator.clipboard.writeText(shareText + '\n\n' + pageUrl);
toast.success('Message + lien copiés ! 📋');
```

### 2. `OnboardingExperience.tsx` — Même traitement

**`handleCopyLink`** (ligne 347) : copier un message viral + URL au lieu de l'URL nue :
```typescript
const url = `${getAppBaseUrl()}/birthday/${birthdayPageSlug}`;
const message = `🎂 C'est bientôt mon anniversaire ! 🎉\n\nÉcris-moi un petit mot, ajoute une photo souvenir ou participe au cadeau collectif 🎁\n\nClique ici, ça prend 30 secondes ⬇️\n\n${url}`;
navigator.clipboard.writeText(message);
```

**`handleShareBirthdayPage`** (ligne 356) : même message viral pour WhatsApp :
```typescript
const text = encodeURIComponent(`🎂 C'est bientôt mon anniversaire ! 🎉\n\nÉcris-moi un petit mot, ajoute une photo souvenir ou participe au cadeau collectif 🎁\n\nClique ici, ça prend 30 secondes ⬇️\n\n${url}`);
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/BirthdayPageShareButton.tsx` | Message viral + copier message complet au lieu de l'URL seule |
| `src/components/OnboardingExperience.tsx` | Même message viral pour handleCopyLink et handleShareBirthdayPage |

