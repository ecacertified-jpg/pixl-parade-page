

# Correction : Boutiques des prestataires introuvables

## Diagnostic

L'erreur "Boutique introuvable" apparaît car les pages publiques tentent d'accéder directement à la table `business_accounts` qui est protégée par RLS (Row Level Security).

### Politiques RLS actuelles de `business_accounts`
| Politique | Qui peut voir |
|-----------|--------------|
| Users can view own | Propriétaire uniquement |
| Admins can view all | Administrateurs |
| **Accès public** | **NON AUTORISÉ** |

### Source du problème
Le fichier `BusinessPreview.tsx` (route `/b/:businessId`) effectue une requête directe sur `business_accounts` :

```typescript
// Ligne 70-85 - BusinessPreview.tsx
const { data } = await supabase
  .from("business_accounts")  // ❌ Table protégée
  .select(...)
```

Cependant, une vue sécurisée `business_public_info` existe déjà et est correctement utilisée dans d'autres parties de l'application (ex: `useVendorProducts.ts`, `useExploreMapData.ts`).

---

## Solution

Modifier `BusinessPreview.tsx` pour utiliser la vue `business_public_info` au lieu de la table `business_accounts`.

### Modification de `src/pages/BusinessPreview.tsx`

**Avant (lignes 70-85)** :
```typescript
const { data, error: fetchError } = await supabase
  .from("business_accounts")
  .select(`
    id,
    business_name,
    business_type,
    description,
    logo_url,
    address,
    latitude,
    longitude
  `)
  .eq("id", businessId)
  .eq("is_active", true)
  .eq("status", "active")
  .maybeSingle();
```

**Après** :
```typescript
const { data, error: fetchError } = await supabase
  .from("business_public_info")  // ✅ Vue sécurisée publique
  .select(`
    id,
    business_name,
    business_type,
    description,
    logo_url,
    address,
    latitude,
    longitude
  `)
  .eq("id", businessId)
  .maybeSingle();
// Note: Pas besoin de filtrer is_active/status car la vue les filtre déjà
```

---

## Flux de données après correction

```text
Utilisateur (anonyme ou connecté)
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
│  ✅ Accessible à tous        │
│  ✅ Filtre is_active=true    │
│  ✅ Filtre status='active'   │
│  ✅ Exclut données sensibles │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Affichage de la boutique    │
│  (aperçu public)             │
└──────────────────────────────┘
```

---

## Fichier modifié

| Fichier | Action |
|---------|--------|
| `src/pages/BusinessPreview.tsx` | Changer `business_accounts` → `business_public_info` |

---

## Avantages de la correction

1. **Sécurité maintenue** : La vue `business_public_info` n'expose que les données non-sensibles (pas de phone, email, payment_info)
2. **Cohérence** : Toutes les pages publiques utilisent la même vue
3. **Pas de modification RLS** : Pas besoin de changer les politiques de sécurité de la base
4. **Simplification** : Les filtres `is_active` et `status` sont déjà dans la vue

