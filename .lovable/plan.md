# Corrections du Worker `jdv-og-router`

## Diagnostic

Le code actuel a 2 défauts qui se manifestent uniquement sur le domaine custom (et pas toujours sur `*.workers.dev`) :

### Problème 1 — Appel Supabase sans `apikey` (CRITIQUE)
```js
return fetch(target, { headers: { "user-agent": ua } });
```
Les Edge Functions Supabase exigent un header `apikey` (anon key) même quand `verify_jwt = false`. Sans ce header, Supabase renvoie `401 Unauthorized` → le crawler WhatsApp reçoit une page d'erreur au lieu des balises OG dynamiques.

### Problème 2 — Boucle de sous-requête pour les humains
```js
return fetch(request);
```
Sur un domaine custom, le Worker est branché sur la route `joiedevivre-africa.com/*`. Quand on fait `fetch(request)` (même URL), Cloudflare réinjecte la requête dans le Worker → boucle détectée → erreur 1042/1019. Il faut taper directement sur l'origine Lovable.

### Problème 3 (mineur) — Query string perdue
`url.pathname` ne contient pas `?s=<versionTag>`. Le cache-buster est perdu lors de l'appel à `birthday-preview`. La fonction continue de marcher (elle lit le slug du path), mais le `?s=` n'est pas transmis.

---

## Nouveau code du Worker

```js
const CRAWLERS = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|PinterestBot|Pinterest|vkShare|Viber|Snapchat|redditbot|embedly|Iframely/i;

const SUPABASE = "https://vaimfeurvzokepqqqrsl.supabase.co";
// Clé anon publique Supabase (sans danger côté Worker)
const SUPABASE_ANON_KEY = "REMPLACER_PAR_LA_CLE_ANON";

// IP de l'origine Lovable (cf. doc custom domain)
const LOVABLE_ORIGIN = "185.158.133.1";

const PREVIEW_MAP = {
  "/birthday/":    "birthday-preview",
  "/anniversaire/": "birthday-preview",
  "/event/":        "event-preview",
  "/evenement/":    "event-preview",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";

    // 1. Crawler → proxy vers Supabase Edge Function
    if (CRAWLERS.test(ua)) {
      for (const [prefix, fn] of Object.entries(PREVIEW_MAP)) {
        if (url.pathname.startsWith(prefix)) {
          const slug = url.pathname.slice(prefix.length).split("/")[0];
          if (!slug) break;
          const target = `${SUPABASE}/functions/v1/${fn}/${slug}${url.search}`;
          return fetch(target, {
            headers: {
              "user-agent": ua,
              "apikey": SUPABASE_ANON_KEY,
              "authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
          });
        }
      }
    }

    // 2. Humain → origine Lovable directement (évite la boucle Worker)
    const originUrl = new URL(url.pathname + url.search, `https://${LOVABLE_ORIGIN}`);
    return fetch(originUrl.toString(), {
      method: request.method,
      headers: { ...Object.fromEntries(request.headers), host: url.hostname },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });
  },
};
```

---

## Étapes pour appliquer

1. Récupérer la **clé anon publique** Supabase (Dashboard → Settings → API → `anon public`). Elle est sans danger côté Worker (publique par design).
2. Dans Cloudflare → Workers & Pages → `jdv-og-router` → **Edit code** → remplacer le contenu de `worker.js` par celui ci-dessus.
3. Remplacer `REMPLACER_PAR_LA_CLE_ANON` par la vraie clé anon (ou la passer en variable d'environnement via **Settings → Variables**).
4. Cliquer **Deploy**.
5. Re-tester avec le WhatsApp Sharing Debugger sur `https://joiedevivre-africa.com/birthday/eva-2026`.

## Test rapide en ligne de commande
```bash
curl -A "WhatsApp/2.23.20.0" -i https://joiedevivre-africa.com/birthday/eva-2026 | head -40
```
Doit retourner `<meta property="og:title" content="🎂 ...">` etc.

## Note
Aucun fichier du projet Lovable n'est modifié — toute la correction se passe dans le Worker Cloudflare.