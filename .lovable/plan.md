

# Système de Mise à Jour Automatique du Référencement

## Analyse de l'Existant

### Infrastructure actuelle de référencement

| Composant | Type | Mise à jour |
|-----------|------|-------------|
| **IndexNow** | Edge Function | Manuelle (appel depuis code) |
| **Sitemaps dynamiques** | Edge Functions (sitemap-generator, sitemap-ai-generator, sitemap-full) | Temps réel (à chaque requête) |
| **Markdown LLM** | Scripts (generate-markdown.mjs) | Au build (prebuild hook) |
| **llms.txt, actions.json** | Fichiers statiques | Manuel |
| **AI Catalog** | Edge Function | Temps réel |

### Déclencheurs existants
- **Produits** : IndexNow appelé manuellement lors de création/modification (AddProductModal, AdminEditProductModal)
- **Boutiques** : IndexNow appelé lors d'activation (BusinessManagement)
- **Triggers SQL** : Nombreux triggers pour notifications, mais aucun pour SEO

---

## Stratégie d'Automatisation Complète

### 1. Triggers de Base de Données pour Indexation Automatique

Créer des triggers PostgreSQL qui appellent automatiquement IndexNow via `pg_net` quand :
- Un **produit** est créé/modifié/activé
- Une **boutique** est approuvée/modifiée
- Une **cagnotte publique** est créée
- Une **page de ville/occasion** SEO est ajoutée

```sql
-- Trigger pour indexation automatique des produits
CREATE OR REPLACE FUNCTION notify_indexnow_on_product_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler IndexNow via pg_net
  PERFORM net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/indexnow-notify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body := json_build_object(
      'urls', ARRAY['https://joiedevivre-africa.com/p/' || NEW.id],
      'entityType', 'product',
      'entityId', NEW.id::text,
      'priority', CASE WHEN NEW.popularity_score > 50 THEN 'high' ELSE 'normal' END
    )::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. CRON Job pour Synchronisation Périodique

Planifier des tâches automatiques via `pg_cron` :

| Job | Fréquence | Action |
|-----|-----------|--------|
| `sync-sitemap-to-search-engines` | Toutes les 6h | Ping Google/Bing avec sitemap URL |
| `refresh-ai-catalog` | Toutes les 2h | Mettre à jour le cache AI Catalog |
| `check-new-seo-content` | Quotidien 8h | Détecter et indexer nouveaux contenus |
| `update-llms-metadata` | Hebdomadaire | Régénérer llms.txt avec stats à jour |

### 3. Edge Function de Synchronisation SEO Centralisée

Créer une fonction `seo-sync-hub` qui :
- Détecte les changements de contenu depuis la dernière synchronisation
- Soumet les nouvelles URLs à IndexNow
- Met à jour les fichiers IA (llms.txt, ai-catalog)
- Notifie les moteurs de recherche

### 4. Webhook pour Réseaux Sociaux

Créer une Edge Function `social-content-sync` qui :
- Génère automatiquement des posts pour nouveaux produits populaires
- Met à jour les Open Graph tags
- Crée des deep links partageables

---

## Architecture Proposée

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOURCES DE DONNÉES                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│  Produits   │  Boutiques  │  Cagnottes  │ Pages SEO   │ Content Data    │
│  (products) │ (business)  │ (funds)     │ (city,      │ (content-data   │
│             │             │             │  occasion)  │  .json)         │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────────┬────────┘
       │             │             │             │               │
       ▼             ▼             ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRIGGERS & ÉVÉNEMENTS                                │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ DB Triggers      │  │ CRON Jobs        │  │ Build Hooks          │  │
│  │ (INSERT/UPDATE)  │  │ (pg_cron)        │  │ (prebuild/postbuild) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
└───────────┼─────────────────────┼────────────────────────┼──────────────┘
            │                     │                        │
            ▼                     ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SEO SYNC HUB (Edge Function)                        │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    seo-sync-orchestrator                           │ │
│  │                                                                    │ │
│  │  • Collecter les changements depuis last_sync                     │ │
│  │  • Construire la liste des URLs à indexer                         │ │
│  │  • Prioriser par type (produit > boutique > cagnotte)             │ │
│  │  • Distribuer aux différentes cibles                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
┌───────────────────┐ ┌──────────────┐ ┌─────────────────────┐
│  MOTEURS RECHERCHE│ │ CHATBOTS IA  │ │ RÉSEAUX SOCIAUX     │
│                   │ │              │ │                     │
│ ┌───────────────┐ │ │┌────────────┐│ │ ┌─────────────────┐ │
│ │ IndexNow      │ │ ││ llms.txt   ││ │ │ Open Graph      │ │
│ │ (Bing,Yandex) │ │ ││ ai-catalog ││ │ │ Twitter Cards   │ │
│ └───────────────┘ │ ││ actions.json│ │ │ WhatsApp        │ │
│ ┌───────────────┐ │ │└────────────┘│ │ └─────────────────┘ │
│ │ Sitemap Ping  │ │ │┌────────────┐│ │ ┌─────────────────┐ │
│ │ (Google,Bing) │ │ ││citations   ││ │ │ Deep Links      │ │
│ └───────────────┘ │ ││.json       ││ │ │ (/go/*)         │ │
│                   │ │└────────────┘│ │ └─────────────────┘ │
└───────────────────┘ └──────────────┘ └─────────────────────┘
```

---

## Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `supabase/functions/seo-sync-orchestrator/index.ts` | Orchestrateur central de synchronisation SEO |
| `supabase/migrations/xxx_seo_auto_triggers.sql` | Triggers SQL pour détection automatique des changements |
| `supabase/migrations/xxx_seo_cron_jobs.sql` | Jobs CRON pour synchronisation périodique |
| `src/hooks/useSEOSync.ts` | Hook React pour déclencher la sync manuellement |
| `scripts/update-seo-metadata.mjs` | Script de mise à jour des fichiers statiques SEO |

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `public/llms.txt` | Ajouter section "Last Updated" dynamique |
| `public/citations.json` | Ajouter stats dynamiques |
| `scripts/generate-markdown.mjs` | Ajouter génération automatique llms.txt |

---

## Détail Technique : SEO Sync Orchestrator

### Edge Function : `seo-sync-orchestrator`

```typescript
interface SyncTask {
  type: 'product' | 'business' | 'fund' | 'page';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  url: string;
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, unknown>;
}

interface SyncResult {
  indexnow: { success: boolean; submitted: number };
  sitemap: { updated: boolean };
  ai_catalog: { refreshed: boolean };
  social: { og_updated: boolean };
}
```

### Actions de la fonction :

1. **Collecter les changements**
   - Lire la table `seo_sync_queue` (nouvelles entrées non traitées)
   - Ou recevoir des événements via webhook

2. **Indexation moteurs de recherche**
   - Appeler `indexnow-notify` avec les URLs
   - Logger les résultats dans `indexnow_submissions`

3. **Mise à jour fichiers IA**
   - Rafraîchir le cache de `ai-catalog`
   - Mettre à jour les stats dans `citations.json`

4. **Ping Sitemaps**
   - Notifier Google : `http://www.google.com/ping?sitemap={url}`
   - Notifier Bing : `http://www.bing.com/ping?sitemap={url}`

---

## Triggers SQL à Créer

### Table de file d'attente SEO

```sql
CREATE TABLE IF NOT EXISTS seo_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'product', 'business', 'fund'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  url TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  metadata JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Trigger Produits

```sql
CREATE OR REPLACE FUNCTION queue_seo_sync_on_product_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne synchroniser que les produits actifs
  IF NEW.is_active = true THEN
    INSERT INTO seo_sync_queue (entity_type, entity_id, action, url, priority, metadata)
    VALUES (
      'product',
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'https://joiedevivre-africa.com/p/' || NEW.id,
      CASE WHEN NEW.popularity_score > 50 THEN 'high' ELSE 'normal' END,
      jsonb_build_object('name', NEW.name, 'price', NEW.price)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_seo_sync_product
AFTER INSERT OR UPDATE OF name, price, description, image_url, is_active
ON products
FOR EACH ROW
EXECUTE FUNCTION queue_seo_sync_on_product_change();
```

### Trigger Boutiques

```sql
CREATE OR REPLACE FUNCTION queue_seo_sync_on_business_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND NEW.status = 'approved' THEN
    INSERT INTO seo_sync_queue (entity_type, entity_id, action, url, priority, metadata)
    VALUES (
      'business',
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'https://joiedevivre-africa.com/b/' || NEW.id,
      'high', -- Boutiques toujours prioritaires
      jsonb_build_object('name', NEW.business_name, 'type', NEW.business_type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Jobs CRON à Créer

### Traitement de la file d'attente SEO (toutes les 15 min)

```sql
SELECT cron.schedule(
  'process-seo-sync-queue',
  '*/15 * * * *', -- Toutes les 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/seo-sync-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body := '{"action": "process_queue"}'::jsonb
  );
  $$
);
```

### Ping sitemaps quotidien (6h du matin)

```sql
SELECT cron.schedule(
  'ping-sitemaps-daily',
  '0 6 * * *', -- Tous les jours à 6h
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/seo-sync-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body := '{"action": "ping_sitemaps"}'::jsonb
  );
  $$
);
```

### Rafraîchissement AI Catalog (toutes les 2h)

```sql
SELECT cron.schedule(
  'refresh-ai-catalog',
  '0 */2 * * *', -- Toutes les 2 heures
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/seo-sync-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body := '{"action": "refresh_ai_catalog"}'::jsonb
  );
  $$
);
```

---

## Script de Build Amélioré

### Mise à jour de `scripts/generate-markdown.mjs`

Ajouter la génération automatique de :
- `public/llms.txt` avec date de mise à jour dynamique
- `public/citations.json` avec stats actualisées
- `public/changelog.md` avec entrée automatique

---

## Tableau de Bord Admin (Optionnel)

Ajouter une section dans le dashboard admin pour :
- Voir l'état de la file d'attente SEO
- Déclencher une synchronisation manuelle
- Consulter les logs IndexNow
- Voir les statistiques d'indexation

---

## Impact Attendu

| Élément | Avant | Après |
|---------|-------|-------|
| **Nouveau produit** | Indexation manuelle | Indexation automatique < 15 min |
| **Nouvelle boutique** | Indexation manuelle | Indexation automatique < 15 min |
| **Sitemap Google** | Crawl aléatoire | Ping quotidien + IndexNow |
| **AI Catalog** | Rafraîchi à la demande | Rafraîchi toutes les 2h |
| **llms.txt** | Mise à jour manuelle | Régénéré au build |

---

## Estimation

| Élément | Quantité |
|---------|----------|
| **Fichiers créés** | 5 |
| **Fichiers modifiés** | 4 |
| **Triggers SQL** | 3 (produits, boutiques, cagnottes) |
| **Jobs CRON** | 3 |
| **Temps d'indexation** | < 15 min (vs plusieurs jours) |

