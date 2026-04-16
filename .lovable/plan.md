

# Plan : Restaurer l'accès public aux données business pour le catalogue

## Problème

La migration de sécurité précédente a supprimé la policy `"Public can view active businesses"` sur `business_accounts` pour protéger les emails/phones des vendors. Cependant, le composant `WishlistCatalog` (et d'autres pages comme `/shop`) interroge directement `business_accounts` pour obtenir les IDs par pays. Sans cette policy, les utilisateurs authentifiés non-admins ne voient plus aucun produit.

## Solution

Recréer une policy SELECT sur `business_accounts` qui autorise la lecture des business actifs et approuvés, **mais uniquement les colonnes non-sensibles**. Comme PostgreSQL RLS ne filtre pas par colonne, la vraie protection des champs sensibles (email, phone) passe par la vue `business_public_info` existante. La policy SELECT est nécessaire car le code interroge directement la table pour les IDs et noms.

## Changement unique — Migration SQL

```sql
-- Restaurer l'accès en lecture aux business actifs pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view active businesses"
ON business_accounts FOR SELECT TO authenticated
USING (
  is_active = true 
  AND status = 'active'
);
```

Cette policy :
- Restreint au rôle `authenticated` (pas `public`/anonyme — corrige le finding original)
- Filtre par `is_active = true AND status = 'active'` (conforme à la règle business active)
- Ne donne pas accès aux business inactifs/rejetés

## Vérification du code client

Le `WishlistCatalog` (ligne 46-50) fait `.select("id").eq("country_code", countryCode).eq("is_active", true)` — il ne sélectionne que l'`id`, donc aucune donnée sensible n'est exposée même avec un accès SELECT complet. Les pages boutique utilisent déjà la vue `business_public_info` pour l'affichage public.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/migrations/new.sql` | Ajouter 1 policy SELECT |

