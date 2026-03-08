

## Plan : Tableau de bord des commissions JDV (Splits Wave)

### Objectif
Ajouter une page admin `/admin/commissions` affichant l'historique des splits de paiement, les montants percus par periode, et le statut des transferts Wave.

### Architecture

La page interroge directement la table `payment_splits` (avec jointure sur `business_orders` pour le contexte) et affiche :
1. **KPI Cards** : total commissions JDV, total verse aux prestataires, nombre de splits, taux de markup moyen
2. **Graphique temporel** (Recharts AreaChart) : evolution des commissions par jour/semaine
3. **Tableau detaille** : liste des splits avec montants, statuts de transfert, date, prestataire

### Fichiers

#### 1. `src/pages/Admin/CommissionsDashboard.tsx` (creation)
- Hook interne pour fetcher `payment_splits` avec jointure `business_orders(id, business_account_id, order_summary, business_accounts(business_name))`
- Selecteur de periode (reutilise `SimplePeriodSelector`)
- 4 KPI cards en haut : Commission JDV totale, Montant prestataires, Nb transactions, Markup moyen
- AreaChart recharts : commissions JDV par jour
- Table avec colonnes : Date, Prestataire, Montant client, Part prestataire, Commission JDV, Markup %, Statut vendeur, Statut plateforme
- Badges colores pour les statuts (simulated=jaune, pending=orange, completed=vert, failed=rouge)
- Export CSV

#### 2. `src/App.tsx` (modification)
- Ajouter lazy import + route `/admin/commissions`

#### 3. `src/components/AdminLayout.tsx` (modification)
- Ajouter entree nav "Commissions" avec icone `DollarSign` ou `Split` apres "Finances"

### Pas de migration SQL necessaire
La table `payment_splits` et ses RLS existent deja.

