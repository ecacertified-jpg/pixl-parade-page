
## Page /data-deletion - Suppression des donnees utilisateur

### Objectif
Creer une page `/data-deletion` conforme aux exigences Meta pour la suppression des donnees utilisateur, en suivant le meme style que les pages legales existantes (LegalNotice, PrivacyPolicy).

### Fichiers a creer

**1. `src/pages/DataDeletion.tsx`**
Page complete avec :
- Header avec bouton retour + logo (meme structure que LegalNotice/PrivacyPolicy)
- Breadcrumb via LegalBreadcrumb
- SEO Head
- Sections :
  - **Introduction** : Explication du droit a la suppression des donnees
  - **Donnees concernees** : Liste des donnees qui seront supprimees (profil, contacts, contributions, posts, notifications)
  - **Donnees conservees** : Ce qui est conserve pour obligations legales (transactions financieres 5 ans, logs d'audit 1 an)
  - **Comment demander la suppression** : 3 methodes (depuis l'app via parametres, par email a contact@joiedevivre-africa.com, via le formulaire sur cette page)
  - **Formulaire de demande** : Champs email + motif + bouton envoyer (avec toast de confirmation)
  - **Delais** : 30 jours pour traitement, confirmation par email
  - **Contact** : Email et telephone

### Fichiers a modifier

**2. `src/components/breadcrumbs/LegalBreadcrumb.tsx`**
- Ajouter `"data-deletion"` au type `LegalPage`
- Ajouter l'entree dans `LEGAL_PAGES` avec label "Suppression des donnees", path "/data-deletion", icone `Trash2`

**3. `src/components/SEOHead.tsx`**
- Ajouter une config `dataDeletion` dans `SEO_CONFIGS` avec titre "Suppression des Donnees | JOIE DE VIVRE" et description appropriee

**4. `src/App.tsx`**
- Ajouter la route `<Route path="/data-deletion" element={<DataDeletion />} />`
- Ajouter l'import lazy ou direct du composant

### Design
- Meme style visuel que LegalNotice et PrivacyPolicy (Cards avec icones, fond gradient)
- Formulaire simple : email (obligatoire) + motif (optionnel) + bouton
- Le formulaire affiche un toast de confirmation (pas d'envoi reel d'email pour l'instant, mais la structure est prete pour integration future avec une edge function)
- Responsive mobile-first

### URL Meta
L'URL finale a renseigner dans les parametres Meta sera :
`https://joiedevivre-africa.com/data-deletion` (ou l'URL Lovable en attendant le domaine custom)
