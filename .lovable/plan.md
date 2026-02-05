

# Correction : Accès public aux boutiques des prestataires

## Diagnostic confirmé

| Élément | État actuel | Problème |
|---------|-------------|----------|
| Vue `business_public_info` | `security_invoker=on` | Respecte les RLS de la table source |
| Table `business_accounts` | RLS activée | Aucune politique pour l'accès public |
| Résultat | Vue inaccessible | Boutiques "introuvables" pour les visiteurs |

### Politiques RLS actuelles de `business_accounts`

| Politique | Condition | Effet |
|-----------|-----------|-------|
| Users can view their own | `auth.uid() = user_id` | Propriétaire seulement |
| Admins can view all | `is_active_admin(auth.uid())` | Administrateurs seulement |
| **Accès public** | **AUCUNE** | Visiteurs bloqués |

---

## Solution

Ajouter une politique RLS sur `business_accounts` permettant de lire les boutiques actives et approuvées.

### Migration SQL

```sql
-- Politique pour permettre la lecture publique des boutiques actives
CREATE POLICY "Public can view active businesses" 
ON public.business_accounts 
FOR SELECT 
TO public
USING (
  is_active = true 
  AND status = 'active' 
  AND deleted_at IS NULL
);
```

### Pourquoi cette approche est sécurisée

1. **SELECT uniquement** : Pas de modification possible
2. **Filtre strict** : Seulement les boutiques actives et approuvées
3. **Vue comme garde supplémentaire** : `business_public_info` n'expose que les champs non-sensibles (exclut `phone`, `email`, `payment_info`, `user_id`)
4. **Cohérence** : Même logique de filtrage dans la politique et dans la vue

---

## Flux de données après correction

```text
Visiteur (anonyme ou authentifié)
        │
        ▼
┌──────────────────────────────┐
│  Route /b/:businessId        │
│  (BusinessPreview.tsx)       │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Vue: business_public_info   │
│  security_invoker = on       │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Table: business_accounts    │
│  RLS: "Public can view       │
│  active businesses"          │
│  ✅ is_active = true         │
│  ✅ status = 'active'        │
│  ✅ deleted_at IS NULL       │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Vue filtre les colonnes     │
│  ❌ phone, email, payment    │
│  ✅ id, name, type, logo...  │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Affichage de la boutique    │
└──────────────────────────────┘
```

---

## Fichiers modifiés

| Type | Fichier | Action |
|------|---------|--------|
| Migration | `supabase/migrations/[timestamp]_add_public_business_access.sql` | Nouvelle politique RLS |

---

## Impact

- **Pages concernées** : `/b/:businessId`, `/boutique/:businessId`, carte des boutiques, liste des produits
- **Aucune modification de code** requise dans `BusinessPreview.tsx`
- **Sécurité maintenue** : Les données sensibles restent protégées via la vue

