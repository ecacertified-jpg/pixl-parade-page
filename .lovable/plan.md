

# Plan : Corriger le lien de partage boutique + confirmer le référencement automatique

## Ce qui existe déjà

Oui, chaque boutique a sa propre page publique accessible via deux routes :

- **`/b/:businessId`** — Page publique (sans authentification), utilisée pour le partage externe
- **`/boutique/:businessId`** — Page complète avec produits, avis, galerie (nécessite connexion)

Le lien de partage est disponible dans le composant `BusinessShareMenu` (bouton de partage sur la page `/boutique/:businessId`), qui génère le lien `/b/:businessId`.

## Référencement automatique — déjà en place

Le système de référencement automatique est **déjà opérationnel** :

| Élément | Statut |
|---------|--------|
| Trigger SQL sur `business_accounts` | Actif — ajoute automatiquement l'URL `/b/{id}` dans `seo_sync_queue` quand une boutique est créée ou modifiée |
| Soumission IndexNow (Bing, Yandex) | Actif — traité toutes les 15 min via CRON |
| Ping sitemaps Google/Bing | Actif — quotidien à 6h UTC |
| SEOHead + JSON-LD LocalBusiness | Actif sur les pages boutique |

Les boutiques approuvées (`is_active = true`, `status = 'approved'`) sont **automatiquement soumises** à Google, Bing et Yandex via IndexNow.

## Bug à corriger

Le `BusinessShareMenu` utilise `window.location.origin` au lieu de `getAppBaseUrl()` (ligne 27). En preview Lovable, le lien partagé pointe vers le domaine preview au lieu de `joiedevivre-africa.com`.

## Correction

| Fichier | Action |
|---------|--------|
| `src/components/BusinessShareMenu.tsx` | Remplacer `window.location.origin` par `getAppBaseUrl()` + ajouter l'import |

### Détail

```typescript
// Avant (ligne 27)
const baseUrl = `${window.location.origin}/b/${businessId}`;

// Après
const baseUrl = `${getAppBaseUrl()}/b/${businessId}`;
```

Ajouter en haut du fichier :
```typescript
import { getAppBaseUrl } from '@/utils/appUrl';
```

