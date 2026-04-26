## Objectif

Quand quelqu'un partage le lien `joiedevivre-africa.com` sur WhatsApp / Facebook / X, l'aperçu doit afficher un titre adapté au pays du partageur :

- 🇨🇮 « Joie de Vivre - Cadeaux Collectifs Côte d'Ivoire | Cagnottes Anniversaire Abidjan »
- 🇧🇯 « Joie de Vivre - Cadeaux Collectifs Bénin | Cagnottes Anniversaire Cotonou »
- 🇸🇳 « Joie de Vivre - Cadeaux Collectifs Sénégal | Cagnottes Anniversaire Dakar »
- 🇹🇬 « Joie de Vivre - Cadeaux Collectifs Togo | Cagnottes Anniversaire Lomé »
- 🇲🇱 « Joie de Vivre - Cadeaux Collectifs Mali | Cagnottes Anniversaire Bamako »
- 🇧🇫 « Joie de Vivre - Cadeaux Collectifs Burkina Faso | Cagnottes Anniversaire Ouagadougou »

## Contrainte technique majeure

Les crawlers de réseaux sociaux (WhatsAppBot, facebookexternalhit, Twitterbot…) **n'exécutent pas le JavaScript**. Ils ne lisent que le HTML brut. Donc il est **impossible** de modifier le titre OG depuis React après chargement — il faut servir un HTML différent côté serveur.

De plus, l'IP du crawler (souvent un serveur US/UE) ne reflète pas le pays du partageur. La seule solution fiable : **encoder le pays dans le lien partagé** (`?c=BJ`) et lire ce paramètre côté serveur.

## Approche en 3 briques

```text
┌──────────────────────────────────────────────────────────────┐
│ 1. App React : détecte le pays du partageur (déjà existant)  │
│    → AdminCountryContext + detectUserCountry() (IP/géoloc)   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Bouton « Partager » : ajoute ?c=<code> au lien copié      │
│    Ex: https://joiedevivre-africa.com/?c=BJ                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Edge Function `home-preview` :                            │
│    - Si User-Agent = crawler → renvoie HTML avec OG adapté   │
│    - Sinon → redirige vers l'app React normalement           │
│    Routée via public/_redirects                              │
└──────────────────────────────────────────────────────────────┘
```

## Détail des changements

### A. Nouvelle Edge Function `home-preview`

Fichier : `supabase/functions/home-preview/index.ts`

Calque sur le pattern existant `join-preview` :
- Détecte les crawlers (liste : facebookexternalhit, WhatsApp, Twitterbot, LinkedInBot, TelegramBot, Slackbot, Discordbot, etc.)
- Lit le paramètre `?c=` (CI / BJ / SN / TG / ML / BF), défaut = CI
- Génère un HTML minimal avec :
  - `<title>` adapté
  - `og:title`, `og:description`, `og:image`, `og:url`
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
  - `og:locale` (fr_CI, fr_BJ, fr_SN…)
  - Schema.org JSON-LD
  - Meta refresh pour rediriger les humains qui atterriraient ici
- Pour les non-crawlers : redirection 302 vers `/` (sans le `?c=` pour ne pas polluer la navigation)

Mapping pays → titre :

| Code | Pays | Capitale économique |
|------|------|---------------------|
| CI | Côte d'Ivoire | Abidjan |
| BJ | Bénin | Cotonou |
| SN | Sénégal | Dakar |
| TG | Togo | Lomé |
| ML | Mali | Bamako |
| BF | Burkina Faso | Ouagadougou |

Ces données sont déjà dans `src/config/countries.ts` (champ `economicCapital`) — on duplique le mapping dans l'edge function (pas d'import depuis `src/`).

### B. Routage via `public/_redirects`

Ajouter une règle **avant** le catch-all `/*` :

```
/    https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/home-preview    200
/?c=:code   https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/home-preview?c=:code   200
/*   /index.html   200
```

⚠️ Risque : router `/` vers une edge function ralentit le first-paint pour tous les visiteurs humains. Pour éviter ça, l'edge function fait un **303 redirect immédiat** vers `/index.html` quand ce n'est pas un crawler (ms ajoutées négligeables). Alternative discutée plus bas.

### C. Boutons de partage : injecter le pays dans l'URL

Localiser tous les endroits où l'URL racine est partagée (probables : `useFundShareCard`, `WhatsAppShareButton`, menus Share du Home/Landing) et ajouter `?c=<code>` quand l'URL pointe vers la racine.

Source du code pays : `useAdminCountry()` ou `detectUserCountry()` (déjà présent dans `src/utils/countryDetection.ts`).

Helper centralisé : `src/utils/buildShareUrl.ts`
```ts
export function buildShareUrl(path = "/", countryCode?: string) {
  const url = new URL(path, "https://joiedevivre-africa.com");
  if (countryCode && countryCode !== "CI") url.searchParams.set("c", countryCode);
  return url.toString();
}
```

(On omet `?c=CI` car CI est le défaut, lien plus propre.)

### D. Fallback `index.html`

Le `<title>` et meta OG dans `index.html` restent en version CI par défaut. Ils ne servent que si l'edge function échoue ou pour le SEO direct sur la racine sans paramètre.

## Variante envisageable (si tu préfères ne pas router `/` via une edge function)

Au lieu d'intercepter la racine, on utilise un **chemin dédié au partage** : `joiedevivre-africa.com/share/BJ` (routé vers l'edge function), qui sert l'aperçu OG aux crawlers et redirige les humains vers `/`. C'est moins risqué côté perf mais l'URL partagée est moins « propre ».

À choisir au moment de l'implémentation si tu as une préférence.

## Ce qui ne change pas

- Le titre affiché à l'écran dans l'app (géré par React/`SEOHead`) — déjà adaptatif
- Les pages `/cagnotte-...`, `/villes/...`, `/p/...`, `/f/...` — chacune a déjà sa propre stratégie SEO
- L'image OG (`og-image.png?v=20260426`) reste la même pour tous les pays

## Cache des réseaux sociaux

Comme déjà documenté, après déploiement il faudra :
- Facebook Debugger → Scrape Again
- Twitter Card Validator
- WhatsApp : ajouter `?v=2` une fois pour forcer le rafraîchissement

## Fichiers impactés

| Fichier | Action |
|---|---|
| `supabase/functions/home-preview/index.ts` | Créer |
| `public/_redirects` | Ajouter route racine vers edge function |
| `src/utils/buildShareUrl.ts` | Créer (helper centralisé) |
| Composants de partage existants (à recenser) | Utiliser `buildShareUrl` avec le pays courant |
