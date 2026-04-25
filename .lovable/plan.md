## Objectif

Sur la page **Catalogue de souhaits** (`/wishlist-catalog`), n'afficher par défaut que les articles du **pays d'origine de l'utilisateur** (celui enregistré dans son profil). Les articles d'autres pays ne doivent apparaître que lorsque l'utilisateur change explicitement de pays via le sélecteur en haut de la page.

## Contexte actuel

Aujourd'hui, le catalogue utilise `countryCode` issu de `CountryContext`. Or ce code provient :
1. d'une éventuelle valeur stockée en `sessionStorage` (ancienne navigation),
2. sinon d'une **auto-détection géographique** (IP/navigateur) déclenchée à chaque nouvelle session,
3. à défaut, du `DEFAULT_COUNTRY_CODE` global.

Résultat : un utilisateur ivoirien voyageant ou avec une IP imprécise peut voir, sans l'avoir demandé, le catalogue d'un autre pays. Le `profileCountryCode` (pays d'origine enregistré sur le profil) est déjà chargé dans le contexte mais **n'est pas utilisé comme valeur par défaut**.

## Approche

Faire en sorte que la page catalogue se base **prioritairement sur le pays du profil** quand l'utilisateur est connecté, tout en respectant un choix explicite fait via le `CountrySelector`.

### Règles de priorité du pays affiché

1. **Choix explicite de l'utilisateur** dans cette session (sélection manuelle dans le `CountrySelector`) → toujours respecté.
2. Sinon, **pays du profil** (`profileCountryCode`) → utilisé comme pays de référence pour le catalogue.
3. Sinon (utilisateur non connecté ou profil sans pays), **pays détecté / par défaut** → comportement actuel inchangé.

### Détection d'un choix explicite

Aujourd'hui, `setCountryCode` écrit la valeur en `sessionStorage` aussi bien lors de l'auto-détection que lors d'un clic utilisateur, donc il n'est pas possible de distinguer les deux. Il faut :

- Distinguer dans `CountryContext` les écritures « auto-détectées » des écritures « manuelles » (ex. nouveau flag `manuallySelected: boolean` stocké en `sessionStorage` sous une clé dédiée, par ex. `joiedevivre_nav_country_manual`).
- Le flag passe à `true` uniquement quand `setCountryCode` est appelé sans le paramètre interne d'auto-détection (c'est-à-dire depuis `CountrySelector` ou `detectCurrentLocation`).
- Lors du chargement du `profileCountryCode`, si **aucun choix manuel n'a été fait dans la session courante**, aligner automatiquement `countryCode` sur le pays du profil et nettoyer la valeur auto-détectée.

### Indication visuelle (légère)

Quand l'utilisateur est en train de visiter un autre pays que le sien (`isVisiting === true`), afficher un petit bandeau discret au-dessus de la grille produits :

> « Vous explorez actuellement le catalogue {pays visité}. [Revenir à {pays d'origine}] »

Le bouton « Revenir » réinitialise le pays courant sur le `profileCountryCode` et efface le flag manuel.

## Changements techniques

### `src/contexts/CountryContext.tsx`
- Ajouter une clé `NAV_STORAGE_MANUAL_KEY = "joiedevivre_nav_country_manual"`.
- `setCountryCode(code, updateProfile?)` marque désormais le flag manuel à `true` (les appels de l'auto-détection passent par un setter interne qui ne le touche pas).
- Dans le `useEffect` de chargement du profil : si `profileCountryCode` est défini ET qu'aucun choix manuel n'existe dans la session courante, appeler le setter interne pour aligner `countryCode` sur `profileCountryCode`.
- Exposer une nouvelle action `resetToHomeCountry()` qui repositionne sur le pays du profil et efface le flag manuel.

### `src/pages/WishlistCatalog.tsx`
- Ajouter un bandeau conditionnel (visible uniquement si `isVisiting` et `profileCountryCode` connu) avec le bouton « Revenir à {pays d'origine} » utilisant `resetToHomeCountry()`.
- Aucune modification de la logique de requête : `useCatalogProducts(countryCode, sort)` continuera à fonctionner, le `countryCode` étant désormais celui du profil par défaut.

### Hook (aucune modif requise)
`useWishlistCatalog.ts` reste tel quel : la requête est déjà filtrée par `country_code`.

## Fichiers modifiés

- `src/contexts/CountryContext.tsx`
- `src/pages/WishlistCatalog.tsx`

## Hors-scope

- Pas de changement du comportement d'auto-détection pour les utilisateurs non connectés.
- Pas de changement sur les autres pages utilisant `useCountry()` (Home, Shop, ExploreMap…) : seul le catalogue est ciblé par cette demande, mais l'amélioration du contexte (priorité au pays du profil) bénéficiera également à ces pages de manière cohérente. Si vous préférez restreindre cette logique uniquement à `WishlistCatalog`, nous pouvons gérer le calcul `effectiveCountry` localement dans la page plutôt que dans le contexte — dites-le-moi avant approbation.