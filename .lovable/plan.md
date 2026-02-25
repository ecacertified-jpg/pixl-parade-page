

## Image OG dynamique pour les liens admin

### Objectif
Remplacer l'image OG statique (`og-image.png`) dans la fonction `join-preview` par une image generee dynamiquement qui affiche le nom de l'admin invitant et le branding Joie de Vivre.

### Fonctionnement actuel
- La fonction `join-preview` renvoie du HTML avec `og:image` pointant vers une image statique (`https://joiedevivre-africa.com/og-image.png`)
- Le projet dispose deja d'un systeme de generation d'images OG (`generate-og-image`) avec cache (`og-cache-utils.ts`) et stockage dans le bucket `og-images-cache`

### Architecture de la solution

```text
Crawler (WhatsApp/Facebook)
    |
    v
join-preview (HTML avec og:image)
    |
    og:image --> generate-admin-og-image?code=ADM-XXXX
                    |
                    v
              Verifie le cache (og_image_cache_metadata)
                    |
              Cache hit? --> Redirige vers image en cache
                    |
              Cache miss? --> Genere l'image avec og_edge
                    |           (nom admin + logo + branding)
                    v
              Stocke dans og-images-cache bucket
                    |
                    v
              Retourne image PNG 1200x630
```

### Etapes d'implementation

#### 1. Creer la nouvelle Edge Function `generate-admin-og-image`

Nouveau fichier : `supabase/functions/generate-admin-og-image/index.tsx`

- Accepte un parametre `?code=ADM-XXXX`
- Recupere le nom de l'admin via les tables `admin_share_codes` > `admin_users` > `profiles`
- Recupere l'avatar de l'admin depuis `profiles.avatar_url` (optionnel)
- Genere une image 1200x630 avec `og_edge` (meme librairie que `generate-og-image`)
- Utilise le systeme de cache existant (`og-cache-utils.ts`)
- Design de l'image :
  - Fond gradient violet/rose (couleurs Joie de Vivre)
  - Emoji cadeau et logo "JOIE DE VIVRE" en haut
  - Texte principal : "Rejoins-nous !" en grand
  - Sous-texte : "Invite par [Nom Admin]"
  - Avatar de l'admin (cercle) si disponible
  - Footer : "joiedevivre-africa.com"
  - Police Poppins (meme que les autres OG images)

#### 2. Modifier `join-preview` pour pointer vers l'image dynamique

Dans `supabase/functions/join-preview/index.ts` :
- Remplacer la constante `OG_IMAGE` statique par l'URL de la nouvelle fonction :
  `${supabaseUrl}/functions/v1/generate-admin-og-image?code=${code}`
- Cela permet aux crawlers de recevoir le lien vers l'image dynamique dans les meta tags

#### 3. Mettre a jour le type `entityType` dans `og-cache-utils.ts`

- Ajouter `"admin"` au type union existant (`"product" | "fund" | "business"`) pour supporter le cache des images admin

### Details techniques

**Cache** : Le hash est base sur le nom de l'admin et son avatar. L'image ne sera regeneree que si ces donnees changent. Duree de cache : 7 jours.

**Fallback** : Si le code admin est invalide ou l'admin introuvable, l'image affichera un design generique sans nom (similaire au comportement actuel du titre).

**Deploiement** : La fonction `generate-admin-og-image` sera deployee automatiquement par Lovable. La fonction `join-preview` necessitera un re-deploiement manuel via CLI comme precedemment.

### Fichiers modifies
| Fichier | Action |
|---------|--------|
| `supabase/functions/generate-admin-og-image/index.tsx` | Creer - Nouvelle Edge Function |
| `supabase/functions/join-preview/index.ts` | Modifier - Pointer og:image vers la fonction dynamique |
| `supabase/functions/_shared/og-cache-utils.ts` | Modifier - Ajouter "admin" au type entityType |

