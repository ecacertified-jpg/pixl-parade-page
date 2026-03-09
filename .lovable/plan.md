

## Plan : Ajouter téléphone et localisation du prestataire sur la facture

### Modifications

**1. `src/hooks/useCustomerOrders.ts`**
- Ajouter `phone` et `address` dans le select de `business_accounts`
- Ajouter `businessPhone?: string` et `businessAddress?: string` à l'interface `CustomerOrder`
- Mapper ces champs dans la transformation

**2. `src/components/OrderInvoiceModal.tsx`**
- Ajouter une section "Prestataire" entre les infos commande et les articles, affichant :
  - Nom de la boutique (déjà disponible)
  - Téléphone du prestataire (icone Phone)
  - Adresse/localisation du prestataire (icone MapPin)
- Inclure ces infos dans le texte de téléchargement

### Fichiers impactés
- `src/hooks/useCustomerOrders.ts`
- `src/components/OrderInvoiceModal.tsx`

