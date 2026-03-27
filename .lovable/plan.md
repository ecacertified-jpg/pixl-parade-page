

# Plan : Enrichir le tableau des splits + champ lien Wave prestataire

## Résumé

Ajouter des colonnes **Article**, **Téléphone**, **Lieu** et un bouton **WAVE** (lien de paiement) dans le tableau "Détail des splits" de `/admin/commissions`. Ajouter un champ **Lien de paiement Wave** dans la config business du prestataire.

## Changements

### 1. Migration : ajouter `wave_payment_link` à `business_accounts`

Nouvelle colonne `wave_payment_link TEXT` nullable pour stocker le lien Wave du prestataire (ex: `https://pay.wave.com/m/...`).

### 2. `src/pages/Admin/CommissionsDashboard.tsx` — Enrichir la requête et le tableau

**Requête** : Étendre le `select` pour récupérer les infos nécessaires :
```
payment_splits → business_orders(id, order_summary, business_accounts(business_name, phone, address, wave_payment_link))
```

**Interface `SplitRow`** : Ajouter `phone`, `address`, `wave_payment_link` dans `business_accounts`, et `order_summary` dans `business_orders`.

**Colonnes du tableau** : Ajouter entre "Prestataire" et "Client" :
- **Article** : extrait de `order_summary.items[0].name` (ou liste si plusieurs)
- **Téléphone** : `business_accounts.phone`
- **Lieu** : `business_accounts.address`

**Colonne Action** : Remplacer le bouton "Transféré" par un bouton **WAVE** (icône Wave, couleur bleue) qui :
- Ouvre le `wave_payment_link` du prestataire avec `?amount={vendor_amount}` pré-rempli
- S'affiche uniquement si `vendor_transfer_status === 'pending'` ou `'simulated'` ET que le lien existe
- Si pas de lien Wave configuré, afficher un message "Lien Wave non configuré"
- Garder le bouton "Transféré" existant pour marquer manuellement après paiement

### 3. `src/components/AddBusinessModal.tsx` — Ajouter le champ lien Wave

Ajouter un champ **"Lien de paiement Wave"** dans la section paiement (après le numéro Wave marchand) :
- Input URL avec placeholder `https://pay.wave.com/m/...`
- Description : "Lien de paiement Wave pour recevoir les virements de la plateforme"
- Sauvegarder dans `wave_payment_link`

### 4. `src/components/admin/AdminEditBusinessModal.tsx` — Même champ

Ajouter le même champ dans le modal d'édition admin.

### 5. `src/components/admin/AdminAddBusinessToOwnerModal.tsx` — Même champ

Ajouter le même champ dans le modal admin de création.

### 6. `src/types/business.ts` — Ajouter le type

Ajouter `wave_payment_link?: string` à l'interface `Business`.

### 7. Export CSV — Ajouter les nouvelles colonnes

Ajouter Article, Téléphone, Lieu dans `handleExport`.

## Fichiers modifiés

- Migration SQL (nouvelle colonne `wave_payment_link`)
- `src/pages/Admin/CommissionsDashboard.tsx`
- `src/components/AddBusinessModal.tsx`
- `src/components/admin/AdminEditBusinessModal.tsx`
- `src/components/admin/AdminAddBusinessToOwnerModal.tsx`
- `src/types/business.ts`

