

## Ajouter un log WhatsApp des cagnottes business dans le dashboard admin

### Objectif

Creer une nouvelle page admin dediee au suivi des envois WhatsApp lies aux cagnottes business (`joiedevivre_group_contribution`), avec un tableau de logs detaille et des KPIs.

### Approche

La table `whatsapp_template_logs` enregistre deja tous les envois. On filtre sur `template_name = 'joiedevivre_group_contribution'` pour isoler les cagnottes business. Pas besoin de nouvelle RPC ni de migration.

### Fichiers a creer / modifier

**1. Nouveau hook : `src/hooks/useBusinessFundWhatsAppLogs.ts`**

- Query sur `whatsapp_template_logs` filtree par `template_name = 'joiedevivre_group_contribution'`
- Tri par `created_at` descendant, limite 200 logs
- Calcul cote client des KPIs : total, succes, echecs, taux de succes
- Accepte un parametre de periode (today, 7days, 30days, 90days) pour filtrer par date

**2. Nouvelle page : `src/pages/Admin/BusinessFundWhatsAppLogs.tsx`**

- Layout admin standard avec `AdminLayout`
- Section KPI : 4 cartes (Total envois, Succes, Echecs, Taux de succes)
- Tableau de logs avec colonnes :
  - Date/heure (formatee)
  - Destinataire (numero masque partiellement pour la confidentialite)
  - Pays (via `country_prefix`)
  - Statut (badge vert/rouge)
  - Erreur (si echec)
  - Params body (nom du beneficiaire, montant, produit extraits de `body_params`)
- Selecteur de periode + bouton rafraichir
- Etat vide si aucun log

**3. Modifier `src/components/AdminLayout.tsx`**

- Ajouter une entree de navigation : `{ title: 'WA Cagnottes', href: '/admin/business-fund-wa', icon: Gift }`
- Placer apres "Templates WA" pour regrouper les outils WhatsApp

**4. Modifier `src/App.tsx`**

- Importer `BusinessFundWhatsAppLogs` et ajouter la route `/admin/business-fund-wa` dans une `AdminRoute`

### Details techniques

- Masquage des numeros : afficher `+225 ** ** ** 45` (4 derniers chiffres visibles)
- Extraction des params body : `body_params` est un JSON array `[prenom, beneficiaire, montant, produit]`
- Utilisation de `date-fns` et `fr` locale pour le formatage des dates
- Composants shadcn/ui existants : Card, Badge, Button, Table

