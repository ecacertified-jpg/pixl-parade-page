
# Previsualisation Open Graph pour les liens de partage Admin

## Objectif

Quand un lien `/join/ADM-XXXX` est partage sur WhatsApp, Facebook, Twitter, etc., les reseaux sociaux afficheront une carte riche avec un titre, une description et une image au lieu d'un lien brut.

## Architecture

Le meme pattern que `fund-preview` et `product-preview` sera utilise :

```text
Reseau social crawle le lien
         |
         v
  join-preview (Edge Function)
         |
    +----+----+
    |         |
 Crawler   Navigateur
    |         |
    v         v
  HTML OG    302 redirect
  meta tags  vers /join/:code
```

## Modifications

### 1. Nouvelle Edge Function : `supabase/functions/join-preview/index.ts`

- Extrait le code admin depuis l'URL (`/join-preview/ADM-XXXX`)
- Requete la table `admin_share_codes` pour verifier que le code est actif
- Recupere le nom de l'admin via `admin_users` + `profiles` (pour personnaliser : "Invite par [Nom]")
- Si crawler : retourne du HTML avec les meta tags OG :
  - **og:title** : "Rejoins Joie de Vivre ! Invite par [Nom Admin]"
  - **og:description** : "Celebrez les moments heureux avec vos proches. Offrez et recevez des cadeaux collectifs en Cote d'Ivoire."
  - **og:image** : Image OG statique par defaut (`/og-image.png`) ou une image personnalisee
  - **og:url** : `https://joiedevivre-africa.com/join/ADM-XXXX`
  - Plus Twitter Card, hreflang, Schema.org
- Si navigateur normal : redirection 302 vers `/join/:code`

### 2. Configuration : `supabase/config.toml`

Ajouter :
```toml
[functions.join-preview]
verify_jwt = false
```

Car les crawlers n'envoient pas de JWT.

### 3. Mise a jour du lien de partage : `src/hooks/useAdminShareCode.ts`

Modifier `getShareLink()` pour pointer vers l'Edge Function au lieu de `/join/:code` directement :

```
Avant : https://joiedevivre-africa.com/join/ADM-XXXX
Apres : https://[supabase-url]/functions/v1/join-preview/ADM-XXXX
```

Cela garantit que les crawlers passent par l'Edge Function (qui retourne les meta OG), tandis que les navigateurs sont rediriges vers la page `/join/:code` existante.

### 4. Mise a jour du message de partage : `src/components/admin/AdminShareMenu.tsx`

Le message de partage utilisera automatiquement le nouveau lien car il recoit `shareLink` en prop depuis `useAdminShareCode`.

## Detail technique de l'Edge Function

```text
1. Parse le code depuis l'URL
2. SELECT admin_share_codes.admin_user_id WHERE code = :code AND is_active = true
3. JOIN admin_users.user_id -> profiles.first_name, profiles.last_name
4. Si crawler -> HTML avec OG meta tags + redirect meta pour les humains
5. Si navigateur -> 302 vers /join/:code sur joiedevivre-africa.com
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/join-preview/index.ts` | Creer |
| `supabase/config.toml` | Ajouter config JWT |
| `src/hooks/useAdminShareCode.ts` | Modifier `getShareLink()` |

## Resultat attendu

Quand un admin partage son lien sur WhatsApp ou Facebook, les utilisateurs verront une carte avec :
- Le logo / image de Joie de Vivre
- Le titre "Rejoins Joie de Vivre !"
- Une description engageante mentionnant l'invitation
- Un lien cliquable qui redirige vers la page d'inscription
