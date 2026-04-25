## Objectif

Donner au prestataire le contrôle de la visibilité publique de son téléphone et de son email sur sa page boutique `/b/:businessId`, via deux toggles indépendants dans ses paramètres. Tant que le toggle est OFF (par défaut), le contact reste masqué et la carte « Support & Infos » retombe sur le contact JOIE DE VIVRE — préservant la politique historique de confidentialité.

## Diagnostic

**Bug latent dans la dernière modification** : `useVendorProducts.ts` (lignes 97-98) force déjà `phone: null` et `email: null` parce que la vue publique `business_public_info` n'expose volontairement PAS ces colonnes (raison sécurité). Donc le code actuel passe toujours `undefined` au `VendorContactCard` et retombe systématiquement sur le contact support — les vrais numéros vendeurs ne s'affichent jamais.

**Schéma actuel** : `business_accounts` contient déjà `phone`, `email`, `website_url` mais aucun flag de visibilité. La vue publique exclut volontairement `phone` et `email` (anon + authenticated y ont accès SELECT).

## Plan d'implémentation

### 1. Migration BDD

Ajouter deux booléens sur `business_accounts` :

```sql
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS show_phone_publicly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_email_publicly boolean NOT NULL DEFAULT false;
```

Recréer la vue `business_public_info` pour exposer **conditionnellement** le téléphone et l'email :

```sql
DROP VIEW IF EXISTS public.business_public_info;
CREATE VIEW public.business_public_info AS
SELECT
  id, business_name, business_type, description, logo_url,
  is_active, is_verified, status, opening_hours, delivery_zones, delivery_settings,
  created_at, updated_at, latitude, longitude, address, country_code, website_url,
  CASE WHEN show_phone_publicly THEN phone ELSE NULL END AS phone,
  CASE WHEN show_email_publicly THEN email ELSE NULL END AS email,
  show_phone_publicly,
  show_email_publicly
FROM business_accounts
WHERE is_active = true AND deleted_at IS NULL AND status = 'active';

GRANT SELECT ON public.business_public_info TO anon, authenticated;
```

Cette approche garantit que phone/email ne quittent JAMAIS la BDD côté public si le toggle est OFF, même si un attaquant manipule le client.

### 2. Hook `useVendorProducts.ts`

- Sélectionner `phone, email` (en plus des colonnes existantes) depuis la vue.
- Renseigner `vendor.phone` / `vendor.email` avec les valeurs réelles (qui seront `null` si non autorisées par le vendeur).

### 3. Page `VendorShop.tsx`

Le bloc actuel reste correct : si `vendor.phone` ou `vendor.email` arrive `null` (cas par défaut ou toggle OFF), on retombe sur `countryConfig.legalEntity`. Aucun changement nécessaire — la sécurité est portée par la vue.

### 4. Hook `useBusinessAccount.ts`

Étendre le `select` pour inclure `show_phone_publicly, show_email_publicly` afin que les paramètres puissent les afficher.

### 5. Page `BusinessProfileSettings.tsx`

Dans la carte « Coordonnées professionnelles » :
- Sous chaque champ (email + téléphone), ajouter un `Switch` shadcn avec libellé : « Afficher publiquement sur ma boutique » (sous-titre court : « Permet aux visiteurs de me contacter directement. Sinon, le support JOIE DE VIVRE est affiché. »)
- Ajouter `show_phone_publicly` et `show_email_publicly` à l'état `business`, à `useEffect` de pré-remplissage et à `handleSave` (UPDATE de `business_accounts`).
- Désactiver le switch (greyed out) si le champ correspondant est vide, avec un texte d'aide : « Renseignez d'abord votre téléphone/email. »

### 6. Mémoire

Mettre à jour `mem://features/vendor/shop-contact-visibility.md` :
- Visibilité contrôlée par le prestataire via deux toggles indépendants `show_phone_publicly` / `show_email_publicly`.
- Par défaut (false), seuls les coordonnées de support JOIE DE VIVRE sont affichées.
- L'application de la règle est faite **côté BDD** dans la vue `business_public_info` (filtrage `CASE WHEN ... THEN ... ELSE NULL`).

## Fichiers modifiés

- Nouvelle migration SQL : ajout des 2 colonnes + recréation de la vue
- `src/hooks/useVendorProducts.ts` (sélection + mapping de phone/email)
- `src/hooks/useBusinessAccount.ts` (sélection des nouveaux flags)
- `src/pages/BusinessProfileSettings.tsx` (état + 2 toggles + sauvegarde)
- `.lovable/mem/features/vendor/shop-contact-visibility.md` (mise à jour de la règle)

## Hors-scope

- Pas de toggle pour `website_url` (un site web est déjà publié par nature, sa visibilité reste systématique s'il est rempli).
- Pas de modification de `BusinessPreview.tsx` (page interne au prestataire, déjà privée).
- Pas de changement RLS sur `business_accounts` directement : la table conserve ses politiques actuelles ; c'est la vue qui filtre.
