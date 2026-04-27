# Détection client du pays + sync avec `buildShareUrl` au moment du partage

## Objectif

Quand un utilisateur clique sur "Partager Joie de Vivre" (InviteFriendsModal, partage natif, copier le lien…), l'URL générée doit **déjà contenir** le bon pays détecté du partageur, sans bloquer le clic ni afficher de spinner.

## État existant (à réutiliser)

Le projet a déjà :

- **`useCountry()`** (`src/contexts/CountryContext.tsx`) : détection auto à l'init de session avec priorités → profil utilisateur → IP (`ipapi.co`) → cache `sessionStorage` → défaut CI. Persisté dans `sessionStorage`.
- **`buildHomeShareUrl(code)`** (`src/utils/buildShareUrl.ts`) : génère l'URL de partage (canonique pour CI/inconnu, edge function `home-preview?c=XX` pour les autres).
- **`InviteFriendsModal`** : modal principal qui contient WhatsApp / Facebook / LinkedIn / SMS / Email / copier le lien / partage natif. Utilise actuellement `getAppBaseUrl()` qui ne sait rien du pays.

Donc la détection client **existe déjà et tourne au boot**. Il suffit de la **brancher** sur `buildHomeShareUrl()` au moment de générer le lien.

## Changements

### 1. Nouveau hook `src/hooks/useShareCountry.ts`

Hook léger et résilient (ne plante pas hors `CountryProvider`, ex. dans la landing publique) :

```ts
import { useCountrySafe } from "@/contexts/CountryContext";

/**
 * Renvoie le code pays détecté pour pré-remplir les liens de partage.
 * - Utilise `useCountry()` si disponible (déjà auto-détecté via IP/profil).
 * - Tombe sur `null` sinon → `buildHomeShareUrl(null)` rendra l'URL canonique.
 * - `isReady` permet aux composants d'afficher l'état de détection si besoin.
 */
export function useShareCountry(): { countryCode: string | null; isReady: boolean } {
  const ctx = useCountrySafe();
  if (!ctx) return { countryCode: null, isReady: true };
  return {
    countryCode: ctx.countryCode ?? null,
    isReady: !ctx.isDetecting,
  };
}
```

Pourquoi `useCountrySafe()` : `InviteFriendsModal` peut être monté avant que `CountryProvider` soit prêt (ou hors arbre dans certains cas), on ne veut pas crasher.

### 2. `src/components/InviteFriendsModal.tsx`

- Importer `useShareCountry` et `buildHomeShareUrl`.
- **Avant** : `const link = \`${getAppBaseUrl()}/auth?invited=true\``.
- **Après** : on construit deux liens :
  - `invitationLink` : pour le formulaire d'invitation classique (avec `?invited=true&c=XX`) — utilise `buildShareUrl('/auth?invited=true', countryCode)`.
  - `homeShareLink` (nouveau) : pour les boutons de partage social (WhatsApp/Facebook/copy/native) qui pointent vers la home — utilise `buildHomeShareUrl(countryCode)`.
- Mettre à jour les 7 handlers `shareViaXxx` pour utiliser `homeShareLink` au lieu de `invitationLink` quand on partage la home (les invitations transactionnelles gardent `invitationLink` — c'est un autre flux).

Concrètement on garde le même lien pour ce modal car son rôle reste « inviter à rejoindre l'app », mais on ajoute le `?c=XX` détecté pour que l'aperçu OG soit bien localisé. Décision : les boutons sociaux (WhatsApp/Facebook/native) pointent vers `homeShareLink`, le SMS/Email transactionnel pointe vers `invitationLink` (pour le tracking d'invitation).

### 3. `src/utils/buildShareUrl.ts` (mineur)

Ajouter un export utilitaire pour le cas où un composant veut juste « pré-charger » le pays :

```ts
/** Réservé aux usages avancés : code pays normalisé ou null. */
export { normalizeCountryCode };
```

Pas de changement de logique — juste rendre la normalisation dispo si besoin futur.

## Comment la détection est "pré-remplie" avant le clic

Pas de surcouche : le `CountryProvider` est monté à la racine de l'app et **lance la détection IP au boot** (`useEffect` ligne 150 de `CountryContext.tsx`). Au moment où l'utilisateur ouvre une modal de partage, `countryCode` est déjà :

1. Soit le pays sauvegardé en `sessionStorage`,
2. Soit le pays du profil (utilisateur connecté),
3. Soit le pays détecté par IP,
4. Soit le défaut `CI`.

Aucune attente, aucun appel réseau au clic.

## Cas limites couverts

| Scénario | Comportement |
|---|---|
| Détection IP en cours quand on ouvre la modal | `countryCode` = défaut `CI` → URL canonique (jamais d'URL invalide). `isReady=false` exposé pour info. |
| Hors `CountryProvider` (ex: composant isolé) | `useCountrySafe()` renvoie `null` → URL canonique. |
| Pays détecté = `CI` | URL canonique (pas de `?c=CI` redondant). |
| Pays détecté = `BJ`/`SN`/etc. | URL `…/home-preview?c=XX` → aperçu localisé pour les crawlers WhatsApp/Facebook. |

## Fichiers touchés

- `src/hooks/useShareCountry.ts` (créé)
- `src/components/InviteFriendsModal.tsx` (modifié — branche les liens via `buildHomeShareUrl`)
- `src/utils/buildShareUrl.ts` (mineur — export `normalizeCountryCode`)

## Tests manuels

1. Ouvrir l'app depuis une IP béninoise → ouvrir `InviteFriendsModal` → cliquer "Copier le lien" → vérifier que le lien copié est `…/home-preview?c=BJ`.
2. Coller ce lien dans WhatsApp Web → vérifier que l'aperçu affiche "Bénin / Cotonou".
3. Utilisateur sans détection (IP inconnue) → lien copié = `https://joiedevivre-africa.com/` (défaut CI canonique).
