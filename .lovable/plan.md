

# Plan : Maximiser la viralite et la visibilite de JDV en Afrique francophone

## Etat actuel

L'infrastructure SEO/AI/social est deja tres solide :
- robots.txt avec tous les crawlers AI autorises
- llms.txt, ai-plugin.json, openapi.yaml, context.md
- IndexNow (Bing/Yandex) automatique via triggers SQL
- Sitemap statique + dynamique + AI
- JSON-LD (WebSite, Organization, WebApplication)
- OG tags + Twitter cards sur toutes les pages
- SEOHead dynamique sur 28+ pages

## Problemes identifies

### 1. Liens partages cassees en preview (8 fichiers)
Huit composants/pages utilisent encore `window.location.origin` au lieu de `getAppBaseUrl()` pour generer des liens partageables. Les liens partages depuis le preview Lovable pointent vers le mauvais domaine.

**Fichiers concernes :**
- `ProductShareMenu.tsx` (ligne 87)
- `ShareFundModal.tsx` (ligne 85)
- `ShareMenu.tsx` (ligne 29)
- `QuickBusinessShareMenu.tsx` (ligne 62)
- `ReferralCodeCard.tsx` (ligne 30)
- `ReferralShareMenu.tsx` (ligne 24)
- `Invitations.tsx` (ligne 33)
- `usePostActions.ts` (ligne 9)

### 2. Messages de partage non viraux
Plusieurs composants partagent des liens "froids" sans message emotionnel. Contrairement a `BirthdayPageShareButton` qui a deja un message viral, les autres composants manquent d'appels a l'action engageants.

### 3. BirthdayCountdownCard partage juste `window.location.origin` sans page specifique

## Corrections

### Partie 1 : Migrer tous les `window.location.origin` vers `getAppBaseUrl()`

Remplacement simple dans les 8 fichiers listes ci-dessus. Ajouter l'import `getAppBaseUrl` la ou il manque.

Note : les fichiers Auth (`Auth.tsx`, `BusinessAuth.tsx`, `AdminAuth.tsx`, `AccountLinking.tsx`) et `BusinessOrdersSection.tsx` utilisent `window.location.origin` a juste titre (redirects OAuth et URLs d'images — ces cas doivent rester tels quels car ce sont des callbacks techniques).

### Partie 2 : Messages viraux pour chaque type de partage

**Produits** (`ProductShareMenu.tsx`) :
```
🎁 J'ai trouve LE cadeau parfait ! ✨
{productName} a seulement {price} FCFA
Sur Joie de Vivre, la boutique de cadeaux en Afrique 🌍
{url}
```

**Cagnottes** (`ShareFundModal.tsx`) — deja bien fait avec templates, juste corriger l'URL.

**Publications** (`ShareMenu.tsx`) :
```
✨ Decouvrez cette publication sur Joie de Vivre !
{excerpt}
{url}
```

**Parrainages** (`ReferralShareMenu.tsx` + `ReferralCodeCard.tsx` + `Invitations.tsx`) :
```
🎉 Rejoins Joie de Vivre, l'appli qui renforce les liens entre proches !
Cree des cagnottes, offre des cadeaux collectifs et ne rate plus aucun anniversaire 🎂
Inscris-toi avec mon lien ⬇️
{url}
```

**BirthdayCountdownCard** : partager le lien de la page anniversaire avec message viral.

### Partie 3 : Copier le message complet (pas juste l'URL)

Quand l'utilisateur clique "Copier le lien", copier le message viral + l'URL (comme deja fait dans `BirthdayPageShareButton`), pas juste l'URL nue.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/ProductShareMenu.tsx` | `getAppBaseUrl()` + message viral |
| `src/components/ShareFundModal.tsx` | `getAppBaseUrl()` |
| `src/components/ShareMenu.tsx` | `getAppBaseUrl()` + message viral |
| `src/components/QuickBusinessShareMenu.tsx` | `getAppBaseUrl()` |
| `src/components/referral/ReferralCodeCard.tsx` | `getAppBaseUrl()` + message viral |
| `src/components/referral/ReferralShareMenu.tsx` | `getAppBaseUrl()` + message viral |
| `src/pages/Invitations.tsx` | `getAppBaseUrl()` + message viral |
| `src/hooks/usePostActions.ts` | `getAppBaseUrl()` |
| `src/components/BirthdayCountdownCard.tsx` | Partager page anniversaire avec message viral |

## Impact attendu

- Tous les liens partages fonctionnent en preview ET en production
- Chaque lien partage sur WhatsApp/Facebook/SMS est accompagne d'un message emotionnel et incitatif
- Le taux de clic sur les liens partages augmente significativement
- L'effet viral se propage : chaque partage genere plus d'ouvertures et d'inscriptions

