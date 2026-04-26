# Validation et fallback générique pour `buildShareUrl`

## Objectif

Quand un code pays **non supporté** (ex: `?c=US`, `?c=ZZ`, valeur vide, casse incorrecte) est passé à `buildShareUrl` ou à l'edge function `home-preview`, on doit :

- **Refuser** silencieusement le code (pas de crash, pas de 500).
- **Retomber** sur un aperçu OG **générique panafricain** :
  - Pays affiché : `Afrique francophone`
  - Capitale affichée : `Capitales africaines`
- Les codes valides (`CI`, `BJ`, `SN`, `TG`, `ML`, `BF`) gardent leur comportement actuel.
- `CI` reste le défaut **uniquement** quand aucun paramètre n'est fourni (lien canonique partagé manuellement).

## Comportement actuel vs. cible

| Cas | Avant | Après |
|---|---|---|
| `?c=BJ` | "Bénin / Cotonou" | inchangé |
| `?c=us` (minuscules valides? non) | "Côte d'Ivoire / Abidjan" (silencieux) | "Afrique francophone / Capitales africaines" |
| `?c=ZZ` | "Côte d'Ivoire / Abidjan" | "Afrique francophone / Capitales africaines" |
| `?c=` (vide) | "Côte d'Ivoire / Abidjan" | "Afrique francophone / Capitales africaines" |
| Aucun `?c=` | "Côte d'Ivoire / Abidjan" | inchangé (défaut canonique CI) |
| `buildHomeShareUrl('XX')` | renvoie URL canonique sans `?c=` | renvoie URL edge function avec `?c=XX` (générique) |

## Changements de fichiers

### 1. `src/utils/buildShareUrl.ts`

- Ajouter un type `CountryValidation = 'supported' | 'invalid' | 'none'`.
- Nouvelle fonction interne `validateCountryCode(code)` qui distingue :
  - `none` : `null`/`undefined`/chaîne vide → URL canonique (défaut CI).
  - `supported` : code dans la liste → URL avec `?c=XX`.
  - `invalid` : code fourni mais inconnu → URL edge function avec `?c=XX` pour que l'edge serve le fallback générique (au lieu d'écraser silencieusement vers CI).
- `buildHomeShareUrl(code)` :
  - `none` ou `CI` → URL canonique `https://joiedevivre-africa.com/`.
  - `supported` (autre que CI) → `…/home-preview?c=XX`.
  - `invalid` → `…/home-preview?c=<code-nettoyé>` (l'edge décidera de servir le fallback générique).
- `buildShareUrl(path, code)` :
  - `none` ou `CI` → URL canonique sans param.
  - `supported` autre que CI → ajoute `?c=XX`.
  - `invalid` → n'ajoute **pas** le paramètre (les pages internes n'ont pas de logique fallback ; on évite de polluer l'URL).
- Ajouter une normalisation : `code.trim().toUpperCase()` avant validation.
- Exporter `isSupportedCountry` (déjà présent en interne) pour usage externe.

### 2. `supabase/functions/home-preview/index.ts`

- Ajouter une entrée fallback `GENERIC` dans une nouvelle constante :
  ```ts
  const GENERIC_META: CountryMeta = {
    country: "Afrique francophone",
    capital: "Capitales africaines",
    locale: "fr",
    description:
      "Première plateforme de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages et célébrations partout en Afrique.",
  };
  ```
- Refactor de `resolveCountry` → renvoie maintenant un objet `{ meta, code, isGeneric }` :
  - Pas de paramètre → `COUNTRY_META.CI` (défaut canonique, comme aujourd'hui).
  - Param présent et valide → `COUNTRY_META[upper]`.
  - Param présent et invalide/inconnu → `GENERIC_META` avec `isGeneric = true`.
- `buildOgHtml` adapté pour gérer le cas générique :
  - Titre générique : `Joie de Vivre - Cadeaux Collectifs en Afrique francophone | Cagnottes Anniversaire`.
  - `og:locale` = `fr`.
  - `og:url` et `canonical` pointent vers `${SITE_URL}/` (sans `?c=` invalide pour ne pas indexer du bruit).
- Branche humains : si code invalide, redirection 302 vers `${SITE_URL}/` **sans** propager le `?c=` invalide.

## Détails techniques

### Liste des pays supportés (source de vérité)

On garde la constante `SUPPORTED_COUNTRIES = ["CI", "BJ", "SN", "TG", "ML", "BF"]` dans `buildShareUrl.ts`. À terme on pourrait dériver de `src/config/countries.ts` (`Object.keys(COUNTRIES)`), mais l'edge function ne peut pas importer ce fichier (Deno côté serveur, pas de bundler). Donc :
- Côté front : on peut utiliser `Object.keys(COUNTRIES)` pour rester DRY.
- Côté edge : liste dupliquée dans `COUNTRY_META` (déjà le cas).

### Sécurité / robustesse

- Limiter le code lu à 2-3 caractères alphanumériques avant validation pour éviter qu'un attaquant n'injecte une chaîne longue dans le HTML : `code.replace(/[^A-Za-z]/g, '').slice(0, 3)`.
- `escapeHtml` est déjà appliqué sur titre/description, donc pas de risque XSS, mais cette protection en amont garde les URLs propres.

### Tests manuels recommandés après implémentation

1. `https://…/home-preview` → CI (défaut, comme aujourd'hui).
2. `https://…/home-preview?c=BJ` → Bénin / Cotonou.
3. `https://…/home-preview?c=US` → Afrique francophone / Capitales africaines.
4. `https://…/home-preview?c=` → CI (paramètre vide = pas de paramètre).
5. `https://…/home-preview?c=%3Cscript%3E` → fallback générique, pas d'injection HTML.
6. Dans l'app : `buildHomeShareUrl('XX')` retourne bien l'URL edge pour déclencher le fallback.

## Fichiers touchés

- `src/utils/buildShareUrl.ts` (modifié)
- `supabase/functions/home-preview/index.ts` (modifié)
