# Memory: seo/auto-sync-system
Updated: 2026-01-29

## Système d'Automatisation SEO

Implémentation complète d'un système de synchronisation SEO automatique pour les moteurs de recherche, chatbots IA et réseaux sociaux.

### Architecture

**1. Table de file d'attente** : `seo_sync_queue`
- Stocke les URL à indexer avec priorité (high/normal/low)
- Colonnes : entity_type, entity_id, action, url, priority, metadata, processed

**2. Triggers automatiques** sur :
- `products` → Détecte INSERT/UPDATE et ajoute à la queue
- `business_accounts` → Détecte approbation/modification
- `collective_funds` → Détecte création de cagnottes publiques

**3. Edge Function** : `seo-sync-orchestrator`
Actions supportées :
- `process_queue` : Traite la file d'attente et soumet à IndexNow
- `ping_sitemaps` : Notifie Google et Bing des mises à jour sitemap
- `refresh_ai_catalog` : Rafraîchit les stats du catalogue IA
- `full_sync` : Exécute toutes les actions

**4. Jobs CRON** :
| Job ID | Nom | Fréquence |
|--------|-----|-----------|
| 12 | `process-seo-sync-queue` | */15 * * * * (toutes les 15 min) |
| 13 | `ping-sitemaps-daily` | 0 6 * * * (6h UTC quotidien) |
| 14 | `refresh-ai-catalog` | 0 */2 * * * (toutes les 2h) |

### Hook React

`useSEOSync.ts` expose :
- `processQueue()` - Traiter la file manuellement
- `pingSitemaps()` - Notifier Google/Bing
- `refreshAICatalog()` - Rafraîchir stats IA
- `fullSync()` - Tout synchroniser
- `queueUrl()` - Ajouter une URL manuellement
- `fetchStats()` - Récupérer statistiques
- `getRecentSubmissions()` - Historique IndexNow

### Build Script

`generate-markdown.mjs` génère automatiquement :
- `public/llms.txt` avec date de mise à jour
- `public/citations.json` avec stats dynamiques
- Fichiers Markdown de documentation

### Tables de statistiques

- `seo_sync_stats` : Dernière sync, stats journalières, stats plateforme
- `indexnow_submissions` : Historique des soumissions IndexNow (existant)

### Impact

| Élément | Avant | Après |
|---------|-------|-------|
| Nouveau produit | Indexation manuelle | Auto < 15 min |
| Nouvelle boutique | Indexation manuelle | Auto < 15 min |
| Sitemap Google | Crawl aléatoire | Ping quotidien |
| AI Catalog | Rafraîchi à la demande | Rafraîchi /2h |
| llms.txt | Mise à jour manuelle | Régénéré au build |
