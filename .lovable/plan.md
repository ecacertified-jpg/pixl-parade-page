## Diagnostic

J'ai testé en parallèle :

| URL | Résultat (User-Agent WhatsApp) |
|---|---|
| `jdv-og-router.dry-pine-f26a.workers.dev/birthday/eva-2026` | ✅ OG dynamique : *"Anniversaire de Eva — 16 ans"* + image générée |
| `joiedevivre-africa.com/birthday/eva-2026` | ❌ OG générique JDV + `og-image.jpg` statique |

**Conclusion :** Le Worker est bien codé et déployé. Mais les **routes Cloudflare `joiedevivre-africa.com/*` et `www.joiedevivre-africa.com/*` ne s'activent pas** sur le domaine custom. WhatsApp tape donc le HTML brut de Lovable au lieu de passer par le Worker.

## Cause

Pour qu'une route Worker `joiedevivre-africa.com/*` fonctionne, le domaine doit :
1. Être **ajouté comme Zone dans Cloudflare** (compte qui héberge le Worker)
2. Avoir ses **nameservers (NS) pointés vers Cloudflare** chez le registrar
3. Avoir ses enregistrements DNS **proxifiés** (nuage orange 🟧)

Or actuellement, le domaine est connecté à Lovable via un A record `185.158.133.1` **en direct** (sans passer par Cloudflare). Les routes Worker ne peuvent donc rien intercepter — Cloudflare ne voit jamais le trafic.

## Deux options de résolution

### Option A — Passer le domaine sous Cloudflare (recommandé pour OG WhatsApp)

1. **Cloudflare → Add a Site** → entrer `joiedevivre-africa.com` (plan Free OK)
2. Cloudflare scanne les DNS existants → vérifier que le A record `@ → 185.158.133.1` et `www → 185.158.133.1` sont présents, **proxy activé (orange)**
3. Chez le registrar du domaine, changer les **nameservers** vers ceux fournis par Cloudflare
4. Attendre l'activation de la zone (5 min à quelques heures)
5. Dans Lovable → Project Settings → Domains → reconnecter le domaine en **cochant "Domain uses Cloudflare or a similar proxy"** (mode CNAME compatible proxy)
6. Une fois actif, les routes Worker s'activeront automatiquement → WhatsApp affichera l'OG dynamique

**Avantage :** OG previews WhatsApp/Facebook parfaites, gratuit, CDN bonus.
**Inconvénient :** changement de nameservers (impact emails à vérifier — MX/SPF/DKIM à recréer dans Cloudflare DNS).

### Option B — Utiliser un sous-domaine dédié au Worker

Garder Lovable sur l'apex, et router uniquement les liens partagés vers un sous-domaine sous Cloudflare :
- Ex : `share.joiedevivre-africa.com/birthday/:slug` géré par le Worker
- Modifier `buildBirthdayShareUrl.ts` pour générer les URL de partage sur ce sous-domaine
- Nécessite quand même que **le sous-domaine** soit sous zone Cloudflare

**Inconvénient :** URLs partagées différentes du domaine principal, moins propre pour le SEO/branding.

## Recommandation

**Option A** est la bonne pour un projet déjà en prod sur ce domaine. Le passage sous Cloudflare apporte aussi : cache CDN gratuit, protection DDoS, analytics, SSL plus fin.

## Question pour toi

Veux-tu :
1. **Migrer le domaine sous Cloudflare** (Option A) — je peux te guider étape par étape pour la migration NS + recréation des DNS (incluant tes emails si tu en as)
2. **Passer par un sous-domaine `share.joiedevivre-africa.com`** (Option B) — je modifie le code de génération d'URL
3. **Abandonner le Worker** et revenir à une solution edge-function only (le bouton "Recharger" Facebook que tu utilises déjà)
