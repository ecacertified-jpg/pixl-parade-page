

## Plan : Ajouter le champ Wave marchand aux formulaires admin

Le champ `wave_merchant_phone` existe deja dans `AddBusinessModal.tsx` (cote prestataire). Il manque dans les 2 modales admin :

### Fichiers a modifier

#### 1. `src/components/admin/AdminEditBusinessModal.tsx`
- Ajouter `wave_merchant_phone` dans l'interface `Business` (ligne 15-31)
- Ajouter `wave_merchant_phone: ''` dans le `formData` state (ligne 71-86)
- Charger la valeur existante dans le `useEffect` (ligne 88-108)
- Inclure `wave_merchant_phone` dans l'objet `updateData` du `handleSubmit` (ligne 133-146)
- Ajouter le champ Input apres le champ "Site web" (apres ligne 299), avec label "Numero Wave marchand", type tel, placeholder "+225 07 XX XX XX XX"

#### 2. `src/components/admin/AdminAddBusinessToOwnerModal.tsx`
- Ajouter `wave_merchant_phone: ''` dans le `formData` state
- Ajouter `wave_merchant_phone` dans le `resetForm()`
- Inclure `wave_merchant_phone` dans l'insert Supabase du `handleSubmit`
- Ajouter le champ Input dans le formulaire, apres le champ "Site web"

Pas de migration SQL necessaire — la colonne `wave_merchant_phone` existe deja sur `business_accounts`.

