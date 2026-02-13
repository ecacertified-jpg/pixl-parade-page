

# Ajouter le support du Togo, Mali et Burkina Faso

## Contexte

La detection automatique du pays se fait a 4 endroits dans le code. Il faut ajouter les prefixes +228 (Togo), +223 (Mali) et +226 (Burkina Faso) dans chacun d'eux.

## Modifications

### 1. Configuration des pays (`src/config/countries.ts`)

Ajouter 3 nouvelles entrees dans l'objet `COUNTRIES` :

- **TG** (Togo, +228) - XOF, WhatsApp fallback active, SMS unavailable
- **ML** (Mali, +223) - XOF, WhatsApp fallback active, SMS unavailable
- **BF** (Burkina Faso, +226) - XOF, WhatsApp fallback active, SMS unavailable

Chaque entree inclura : nom, drapeau, devise (XOF/FCFA), prefixe, capitale, coordonnees carte, entite legale placeholder, fournisseurs Mobile Money locaux, et parametres SMS/WhatsApp.

### 2. Edge Function `verify-whatsapp-otp` (`supabase/functions/verify-whatsapp-otp/index.ts`)

Etendre la detection du pays (ligne 150-152) :

```text
Avant:  +229 -> BJ, +221 -> SN, +225 -> CI, defaut -> CI
Apres:  +229 -> BJ, +221 -> SN, +228 -> TG, +223 -> ML, +226 -> BF, +225 -> CI, defaut -> CI
```

### 3. Edge Function `admin-create-user` (`supabase/functions/admin-create-user/index.ts`)

Meme ajout dans la detection du pays (ligne 157-161).

### 4. Trigger base de donnees `handle_new_user()`

Migration SQL pour ajouter les 3 nouveaux prefixes dans le CASE :

```sql
WHEN phone_number LIKE '+228%' THEN 'TG'
WHEN phone_number LIKE '+223%' THEN 'ML'
WHEN phone_number LIKE '+226%' THEN 'BF'
```

## Details techniques

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/config/countries.ts` | Ajout des configs TG, ML, BF |
| `supabase/functions/verify-whatsapp-otp/index.ts` | 3 nouveaux prefixes dans la detection |
| `supabase/functions/admin-create-user/index.ts` | 3 nouveaux prefixes dans la detection |
| Migration SQL (nouveau fichier) | Mise a jour de `handle_new_user()` avec les 3 prefixes |

### Informations pays

| Pays | Code | Prefixe | Drapeau | Capitale | Mobile Money |
|------|------|---------|---------|----------|-------------|
| Togo | TG | +228 | flag TG | Lome | Flooz, T-Money |
| Mali | ML | +223 | flag ML | Bamako | Orange Money, Moov Money |
| Burkina Faso | BF | +226 | flag BF | Ouagadougou | Orange Money, Moov Money |

Tous utilisent le XOF (FCFA), le francais, et auront le SMS marque comme `unavailable` avec WhatsApp fallback active (comme le Benin).

