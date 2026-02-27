

## Ajouter le suivi du template `joiedevivre_fund_ready` dans la page WA Cagnottes

### Objectif

La page `/admin/business-fund-wa` ne suit actuellement que le template `joiedevivre_group_contribution` (invitations aux amis). Il faut y ajouter le template `joiedevivre_fund_ready` (notification au prestataire quand la cagnotte atteint 100%) pour avoir une vue complete du cycle de vie WhatsApp des cagnottes business.

### Approche

Ajouter un systeme d'onglets (Tabs) pour basculer entre les deux templates, avec des KPIs et logs independants pour chacun. Le hook sera modifie pour accepter le nom du template en parametre.

### Modifications

**1. Hook `src/hooks/useBusinessFundWhatsAppLogs.ts`**

- Ajouter un parametre `templateName` (defaut : `joiedevivre_group_contribution`)
- L'utiliser dans le filtre `.eq('template_name', templateName)`
- Ajouter `templateName` dans la `queryKey` pour que les deux onglets aient leur propre cache

**2. Page `src/pages/Admin/BusinessFundWhatsAppLogs.tsx`**

- Ajouter des onglets (composant `Tabs` de shadcn/ui) : "Invitations amis" et "Notification prestataire"
- Chaque onglet appelle le hook avec son template respectif
- L'onglet "Notification prestataire" adapte les labels des colonnes body_params :
  - `{{1}}` = Prenom prestataire, `{{2}}` = Titre cagnotte, `{{3}}` = Montant, `{{4}}` = Produit, `{{5}}` = Beneficiaire
- Les KPIs sont recalcules par onglet actif
- Le sous-titre de la page est mis a jour pour refleter les deux flux

### Details techniques

- Extraction des params adaptee par template :
  - `joiedevivre_group_contribution` : `[prenom, beneficiaire, montant, produit]` (4 params)
  - `joiedevivre_fund_ready` : `[prenom_prestataire, titre_cagnotte, montant, produit, beneficiaire]` (5 params)
- Composant interne `LogsTab` pour eviter la duplication du tableau entre les deux onglets
- Pas de migration ni de nouvelle RPC necessaire

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useBusinessFundWhatsAppLogs.ts` | Ajouter parametre `templateName` au hook |
| `src/pages/Admin/BusinessFundWhatsAppLogs.tsx` | Ajouter Tabs avec deux onglets, composant LogsTab reutilisable, extraction params adaptee par template |

