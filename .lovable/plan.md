
# Système de Raccourcissement d'URL pour SMS

## Contexte

Les SMS avec URLs longues ou complètes (ex: `https://joiedevivre-africa.com/favorites`) peuvent :
1. Être filtrés par les opérateurs (anti-phishing)
2. Consommer des caractères précieux (limite 160)
3. Apparaître peu professionnels

## Solution Proposée

Créer un module partagé `_shared/url-shortener.ts` utilisant l'API TinyURL (gratuite, sans clé API, fiable) avec un cache en base de données pour éviter les appels répétés.

### Architecture

```text
┌─────────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Edge Functions    │ ──── │  url-shortener   │ ──── │   TinyURL   │
│  (notify-contact,   │      │    (module)      │      │     API     │
│   birthday-alerts)  │      └────────┬─────────┘      └─────────────┘
└─────────────────────┘               │
                                      ▼
                              ┌───────────────────┐
                              │  shortened_urls   │
                              │     (cache)       │
                              └───────────────────┘
```

## Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/functions/_shared/url-shortener.ts` | Créer | Module principal de raccourcissement |
| Table `shortened_urls` | Créer (SQL) | Cache des URLs raccourcies |
| `supabase/functions/notify-contact-added/index.ts` | Modifier | Intégrer le raccourcisseur |
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Modifier | Intégrer le raccourcisseur |

---

## Détails Techniques

### 1. Nouveau Module : `_shared/url-shortener.ts`

```typescript
/**
 * URL Shortener Module using TinyURL API
 * Features: caching, fallback, SMS-optimized
 */

// Cache TTL in days
const CACHE_TTL_DAYS = 30;

export interface ShortenResult {
  success: boolean;
  shortUrl: string;
  originalUrl: string;
  cached: boolean;
  error?: string;
}

/**
 * Shortens a URL using TinyURL API with database caching
 * Falls back to original URL if shortening fails
 */
export async function shortenUrl(
  longUrl: string,
  supabaseClient: any
): Promise<ShortenResult> {
  
  // 1. Check cache first
  const { data: cached } = await supabaseClient
    .from('shortened_urls')
    .select('short_url, created_at')
    .eq('original_url', longUrl)
    .single();
  
  if (cached) {
    // Check if cache is still valid (30 days)
    const cacheAge = Date.now() - new Date(cached.created_at).getTime();
    if (cacheAge < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
      return {
        success: true,
        shortUrl: cached.short_url,
        originalUrl: longUrl,
        cached: true
      };
    }
  }
  
  // 2. Call TinyURL API (no auth required)
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
    );
    
    if (!response.ok) {
      throw new Error(`TinyURL API error: ${response.status}`);
    }
    
    const shortUrl = await response.text();
    
    // 3. Cache the result
    await supabaseClient
      .from('shortened_urls')
      .upsert({
        original_url: longUrl,
        short_url: shortUrl,
        created_at: new Date().toISOString()
      }, { onConflict: 'original_url' });
    
    return {
      success: true,
      shortUrl,
      originalUrl: longUrl,
      cached: false
    };
    
  } catch (error) {
    console.error('URL shortening failed:', error);
    
    // Fallback: return original URL without https://
    const fallback = longUrl.replace(/^https?:\/\//, '');
    return {
      success: false,
      shortUrl: fallback,
      originalUrl: longUrl,
      cached: false,
      error: error.message
    };
  }
}

/**
 * Shortens URL for SMS (removes https:// from TinyURL result)
 * TinyURL returns: https://tinyurl.com/abc123
 * We return: tinyurl.com/abc123 (saves 8 chars)
 */
export async function shortenUrlForSms(
  longUrl: string,
  supabaseClient: any
): Promise<string> {
  const result = await shortenUrl(longUrl, supabaseClient);
  
  // Remove https:// to save characters
  return result.shortUrl.replace(/^https?:\/\//, '');
}
```

### 2. Table de Cache SQL

```sql
CREATE TABLE IF NOT EXISTS shortened_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url text UNIQUE NOT NULL,
  short_url text NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_shortened_urls_original ON shortened_urls(original_url);

-- RLS: Only service role can access
ALTER TABLE shortened_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON shortened_urls
  FOR ALL USING (auth.role() = 'service_role');
```

### 3. Modification de `notify-contact-added/index.ts`

```typescript
// Ajouter l'import
import { shortenUrlForSms } from "../_shared/url-shortener.ts";

// Dans la fonction serve(), après la création du client admin:
const baseUrl = 'https://joiedevivre-africa.com/favorites';
const shortUrl = await shortenUrlForSms(baseUrl, supabaseAdmin);

// Message optimisé avec URL courte
const message = `${userName} t'a ajouté à son cercle! Anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}. Crée ta liste: ${shortUrl}`;
```

### 4. Modification des autres Edge Functions

Même pattern pour :
- `check-birthday-alerts-for-contacts/index.ts`
- `birthday-reminder-with-suggestions/index.ts`
- Tout autre SMS contenant un lien

---

## Avantages de TinyURL

| Critère | TinyURL | Bit.ly |
|---------|---------|--------|
| Clé API requise | Non | Oui |
| Limite gratuite | Illimitée | 1000/mois |
| Longueur URL | ~25 chars | ~22 chars |
| Fiabilité | Excellente | Excellente |
| Analytics | Non | Oui (payant) |

**Choix : TinyURL** pour sa simplicité (aucune configuration requise).

---

## Exemple de Résultat

| Avant | Après |
|-------|-------|
| `joiedevivre-africa.com/favorites` (33 chars) | `tinyurl.com/abc123` (~19 chars) |
| Message: ~110 chars | Message: ~96 chars |

**Gain : ~14 caractères** + meilleure délivrabilité (pas de domaine personnalisé filtré).

---

## Plan d'Exécution

1. Créer la table `shortened_urls` via migration SQL
2. Créer le module `_shared/url-shortener.ts`
3. Modifier `notify-contact-added/index.ts` pour utiliser le raccourcisseur
4. Modifier `check-birthday-alerts-for-contacts/index.ts`
5. Déployer et tester avec un nouveau contact
