

## Corriger l'affichage de la cagnotte pour les utilisateurs WhatsApp non authentifies

### Cause racine

La page `FundPreview.tsx` (`/f/:fundId`) fait une requete Supabase avec des **JOINs** vers 3 tables :

```
collective_funds
  -> contacts (beneficiaire)    -- RLS: auth.uid() = user_id (BLOQUE les anonymes)
  -> profiles (createur)        -- RLS: auth.uid() = user_id OU privacy=public (BLOQUE si prive)
  -> products (produit)         -- RLS: is_active = true (OK pour anonymes)
```

Le probleme : les destinataires WhatsApp arrivent sur la page **sans etre connectes**. La policy RLS de `collective_funds` autorise bien la lecture (`is_public = true`), mais les **JOINs vers `contacts` et `profiles` echouent** car ces tables exigent `auth.uid()` qui est `NULL` pour un visiteur anonyme. PostgREST peut retourner une erreur ou des donnees incompletes qui font echouer `.single()`.

### Solution

Modifier `FundPreview.tsx` pour separer la requete en deux parties :

1. **Requete principale sans JOINs sensibles** : Recuperer uniquement les champs de `collective_funds` et le JOIN `products` (qui a une policy publique)
2. **Affichage gracieux** : Ne plus dependre des donnees `contacts` et `profiles` pour le rendu de la page anonyme. Le nom du beneficiaire et du createur ne seront simplement pas affiches pour les visiteurs non connectes.

### Modifications

**Fichier : `src/pages/FundPreview.tsx`**

Remplacer la requete actuelle :
```text
// AVANT (echoue pour les anonymes a cause des JOINs contacts/profiles)
.select(`
  id, title, ...,
  products:business_product_id (id, name, image_url, price),
  contacts:beneficiary_contact_id (id, name, avatar_url),   -- BLOQUE
  profiles:creator_id (first_name, last_name)                -- BLOQUE
`)
```

Par une requete en 2 etapes :
```text
// APRES : requete de base avec seulement le JOIN products (public)
.select(`
  id, title, description, target_amount, current_amount,
  currency, occasion, status, deadline_date, created_at,
  products:business_product_id (id, name, image_url, price)
`)

// Puis, seulement si l'utilisateur est connecte, enrichir avec contacts + profiles
```

Adapter le composant pour afficher la cagnotte meme sans les donnees du beneficiaire/createur. Le produit, le montant, la progression et le bouton "Contribuer" seront toujours visibles.

### Impact

- Les visiteurs WhatsApp non connectes verront la cagnotte avec le produit, le montant et le bouton Contribuer
- Les visiteurs connectes verront en plus le nom du beneficiaire et du createur
- Aucune modification de base de donnees necessaire
- Aucune modification des policies RLS

