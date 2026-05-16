
## Le vrai problème

Sur le hosting Lovable, `joiedevivre-africa.com/birthday/<slug>` renvoie toujours `index.html` (le SPA), peu importe le User-Agent. WhatsApp lit donc l'image OG générique JDV au lieu de l'image de l'album. Lovable n'exécute pas `public/_redirects` (convention Netlify uniquement) et il n'y a aucun hook serveur exposé pour injecter des meta tags dynamiques par slug.

Conséquence : **il est impossible, depuis le code du projet seul, de servir un OG correct sur `joiedevivre-africa.com/birthday/<slug>`**. Il faut un composant d'infrastructure devant le domaine qui sache router les crawlers vers l'edge function `birthday-preview` et les humains vers le SPA.

## Solution recommandée : Cloudflare Worker en frontal du domaine

C'est l'approche standard pour ce cas (custom OG sur hosting statique). Une seule pièce d'infra, ~30 lignes de code, gratuite jusqu'à 100k req/jour.

### Architecture

```text
WhatsApp/Facebook ──┐
                    ├──► joiedevivre-africa.com ──► Cloudflare Worker
Navigateur humain ──┘                                      │
                                                           ├─ crawler + /birthday/* ──► fetch(supabase birthday-preview) ──► HTML OG
                                                           ├─ crawler + /f/*,/b/*,/p/*,/event/* ──► fetch(<preview function correspondante>)
                                                           └─ tout le reste ──► fetch(origine Lovable actuelle) ──► SPA
```

L'URL partagée reste `https://joiedevivre-africa.com/birthday/<slug>?s=<version>`. WhatsApp voit l'image de l'album. L'humain qui clique atterrit directement sur le SPA (pas de 302 visible).

### Étapes

1. **DNS** — Passer `joiedevivre-africa.com` derrière Cloudflare (changer les nameservers chez le registrar pour ceux fournis par Cloudflare). Le DNS reste pointé vers Lovable (CNAME existant), Cloudflare devient juste le proxy (orange cloud ON).

2. **Worker** — Créer un Worker avec le code ci-dessous, le router sur `joiedevivre-africa.com/*` et `www.joiedevivre-africa.com/*`. À déployer depuis le dashboard Cloudflare (5 min, pas besoin de CLI).

3. **Code du projet** — Revenir `buildBirthdayShareUrl` à l'URL jolie `https://joiedevivre-africa.com/birthday/<slug>?s=<version>`. Les fichiers concernés :
   - `src/utils/buildBirthdayShareUrl.ts` — retourner l'URL canonique du domaine.
   - `src/components/ShareBirthdayToCirclesModal.tsx` et `src/pages/Dashboard.tsx` — aucun changement (ils appellent déjà `buildBirthdayShareUrl`).
   - Garder `public/_redirects` pour mémoire (ignoré par Lovable mais utile si un jour migration vers Netlify/Vercel).

4. **Vérification**
   - `curl -A "WhatsApp/2.24.10 i" https://joiedevivre-africa.com/birthday/ange-felicia--2026?s=...` → doit retourner le HTML `birthday-preview` avec `og:image` = photo de l'album.
   - `curl -A "Mozilla/5.0 ..." https://joiedevivre-africa.com/birthday/ange-felicia--2026?s=...` → doit retourner `index.html` (le SPA Lovable).
   - WhatsApp doit afficher la photo ET l'URL jolie sous l'aperçu.

### Détails techniques

#### Code du Worker (à coller dans le dashboard Cloudflare)

```js
const CRAWLERS = [
  "facebookexternalhit", "facebot", "twitterbot", "whatsapp", "linkedinbot",
  "slackbot", "telegrambot", "discordbot", "googlebot", "bingbot",
  "applebot", "pinterestbot", "pinterest", "vkshare", "viber",
  "snapchat", "redditbot", "embedly", "iframely",
];
const SUPA = "https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1";
const PREVIEW_ROUTES = [
  { prefix: "/birthday/",     fn: "birthday-preview" },
  { prefix: "/anniversaire/", fn: "birthday-preview" },
  { prefix: "/f/",            fn: "fund-preview"     },
  { prefix: "/b/",            fn: "business-preview" },
  { prefix: "/p/",            fn: "product-preview"  },
  { prefix: "/event/",        fn: "event-preview"    },
  { prefix: "/evenement/",    fn: "event-preview"    },
  { prefix: "/join/ADM-",     fn: "join-preview", keepFullPath: true },
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    const isCrawler = CRAWLERS.some(c => ua.includes(c));

    if (isCrawler) {
      for (const r of PREVIEW_ROUTES) {
        if (url.pathname.startsWith(r.prefix)) {
          const slug = r.keepFullPath
            ? url.pathname.replace("/join/", "")
            : url.pathname.slice(r.prefix.length);
          const target = `${SUPA}/${r.fn}/${slug}${url.search}`;
          return fetch(target, { headers: { "user-agent": request.headers.get("user-agent") } });
        }
      }
    }
    // Humans (or non-preview paths) → origine Lovable normale
    return fetch(request);
  },
};
```

#### Patch `buildBirthdayShareUrl.ts`

```ts
const PUBLIC_DOMAIN = "https://joiedevivre-africa.com";

export function buildBirthdayShareUrl(slug, opts) {
  const url = new URL(`${PUBLIC_DOMAIN}/birthday/${encodeURIComponent(slug)}`);
  if (opts && (opts.updatedAt || opts.socialSharePhotoId)) {
    url.searchParams.set("s", computeBirthdayShareVersionTag(opts));
  }
  return url.toString();
}
```

## Alternatives (moins recommandées)

- **Garder l'URL Supabase actuelle** — fonctionne immédiatement (déjà en place) mais l'URL est moche dans WhatsApp. C'est ce qu'on a aujourd'hui.
- **Demander à Lovable d'ajouter un edge route natif** — plus propre à terme mais dépend de leur roadmap et n'est pas exposé dans l'UI aujourd'hui.
- **Cloudflare "Bulk Redirects" sans Worker** — ne marche pas car il faudrait rediriger les crawlers et préserver les humains, ce qui nécessite la lecture du User-Agent (donc un Worker).

## Notes

- Le Worker s'applique aussi automatiquement aux autres preview functions (`/f/`, `/b/`, `/p/`, `/event/`, `/join/`) qui ont le même problème que `/birthday/`.
- Les liens WhatsApp déjà envoyés avec l'URL Supabase resteront figés dans le cache WhatsApp — il faudra repartager depuis l'app pour voir la nouvelle URL jolie.
- Aucun changement DB ni edge function nécessaire.
