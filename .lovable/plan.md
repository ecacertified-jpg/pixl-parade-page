
# Plan de Correction des Vulnerabilites de Securite

## Resume des Problemes Identifies

| Probleme | Table | Severite | Impact |
|----------|-------|----------|--------|
| Exposition des donnees de contact des entreprises | business_accounts | Elevee | Phone, email, payment_info exposes a tous les utilisateurs authentifies |
| Politique SELECT trop permissive | business_accounts | Elevee | La politique "Authenticated users can view active businesses" contourne la vue securisee |
| Donnees sensibles exposees dans profiles | profiles | Moyenne | Coordonnees GPS, telephone accessibles selon privacy_setting |
| Fonctions sans search_path | Diverses | Faible | 10 fonctions PostgreSQL vulnerables a l'injection de schema |
| Vues SECURITY DEFINER | Diverses | Info | Intentionnel - design pattern correct deja ignore |

## Strategie de Correction Sans Impact

La correction se fait en 3 etapes independantes, chacune n'affectant pas les fonctionnalites existantes.

## Partie 1 : Securiser business_accounts (Priorite Haute)

### Situation Actuelle

```text
business_accounts (table)
├── Politique: "Authenticated users can view active businesses"
│   └── USING (is_active = true)  ← Expose TOUTES les colonnes!
│
├── Politique: "Users can view their own business accounts"
│   └── USING (auth.uid() = user_id)  ← OK pour proprietaires
│
└── Politique: "Admins can view all business accounts"
    └── USING (EXISTS admin_users...)  ← OK pour admins
```

### Solution

1. Supprimer la politique permissive qui expose les donnees sensibles
2. Forcer l'utilisation de la vue `business_public_info` dans le code client
3. Garder l'acces complet pour les proprietaires et admins

### Migration SQL

```sql
-- Supprimer la politique trop permissive
DROP POLICY IF EXISTS "Authenticated users can view active businesses" 
ON public.business_accounts;

-- Creer une politique restrictive pour la lecture publique
-- Elle ne permet l'acces qu'aux proprietaires et admins
-- Les autres utilisateurs doivent utiliser la vue business_public_info
```

### Fichiers a Modifier (Code Client)

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useVendorProducts.ts` | Utiliser `business_public_info` pour les donnees publiques + appel separe pour contact si necessaire |
| Autres fichiers | Aucun changement - ils accedent deja a leurs propres donnees ou sont admins |

## Partie 2 : Creer une Vue Enrichie pour les Commerces Publics

### Probleme
La vue `business_public_info` actuelle exclut les coordonnees GPS (latitude, longitude) necessaires pour l'affichage sur la carte.

### Solution

Recreer la vue `business_public_info` avec les champs non-sensibles necessaires :

```sql
CREATE OR REPLACE VIEW public.business_public_info 
WITH (security_invoker=on) AS
SELECT 
  id,
  business_name,
  business_type,
  description,
  logo_url,
  is_active,
  is_verified,
  status,
  opening_hours,
  delivery_zones,
  delivery_settings,
  created_at,
  -- Ajouts pour fonctionnalites carte et localisation
  latitude,
  longitude,
  address,           -- Adresse publique (pas le payment_info)
  country_code,
  city
  -- phone, email, payment_info, user_id EXCLUS
FROM business_accounts
WHERE is_active = true;
```

## Partie 3 : Securiser les Fonctions PostgreSQL

### Fonctions Affectees

10 fonctions n'ont pas de `search_path` defini, les rendant vulnerables a l'injection de schema.

### Solution

Ajouter `SET search_path = public` a chaque fonction via une migration.

## Impact sur les Fonctionnalites

| Fonctionnalite | Impact |
|----------------|--------|
| Affichage des commerces sur la carte | Aucun - latitude/longitude inclus dans la vue |
| Page prestataire (VendorProducts) | Aucun - utilisation de la vue mise a jour |
| Dashboard prestataire | Aucun - proprietaires accedent toujours a leurs donnees |
| Admin Dashboard | Aucun - admins ont acces complet |
| Formulaire contact prestataire | Aucun - les infos de contact seront dans la vue |

## Fichiers a Modifier

### 1. Migration SQL (nouveau fichier)
`supabase/migrations/[timestamp]_fix_security_vulnerabilities.sql`

Contenu :
- DROP POLICY permissive sur business_accounts
- ALTER VIEW business_public_info avec champs necessaires
- SET search_path sur les fonctions affectees

### 2. Code Client (optionnel - amelioration)
`src/hooks/useVendorProducts.ts`
- Remplacer `.from('business_accounts')` par `.from('business_public_info')` 
- Ajouter les champs address, latitude, longitude a la selection

## Ordre d'Execution

```text
1. Creer la migration SQL
   ├── Modifier la vue business_public_info (ajouter les champs publics manquants)
   ├── Supprimer la politique permissive
   └── Securiser les fonctions

2. Modifier useVendorProducts.ts (si necessaire)
   └── Utiliser la vue au lieu de la table directe
```

## Verification Post-Deploiement

Tester que :
1. La page prestataire affiche toujours les informations correctement
2. La carte des commerces fonctionne toujours
3. Les admins peuvent toujours voir toutes les donnees
4. Les proprietaires peuvent toujours gerer leurs commerces
5. Les utilisateurs non-connectes ne voient pas phone/email/payment_info

## Risques et Mitigation

| Risque | Mitigation |
|--------|------------|
| Champs manquants dans la vue | Ajouter tous les champs publics necessaires avant de supprimer la politique |
| Erreurs RLS | Tester en environnement de dev avant deploiement |
| Cache client | Aucun cache problematique - les requetes sont dynamiques |

## Resume des Changements

| Fichier | Type | Changement |
|---------|------|------------|
| Migration SQL | Nouveau | Correction RLS et securisation fonctions |
| useVendorProducts.ts | Modification | Utiliser vue securisee |

Cette approche garantit que :
- Les donnees sensibles des entreprises (phone, email, payment_info) ne sont plus exposees
- Toutes les fonctionnalites existantes continuent de fonctionner
- La securite est renforcee au niveau base de donnees (defense en profondeur)
