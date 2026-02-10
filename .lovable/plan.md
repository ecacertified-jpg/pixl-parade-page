
# Page admin dediee aux cagnottes par pays

## Objectif

Creer une page `/admin/countries/:countryCode/funds` qui affiche les cagnottes collectives filtrees par pays, suivant le meme modele que `CountryUsersPage` et `CountryBusinessesPage`.

## Modifications

### 1. Creer `src/pages/Admin/CountryFundsPage.tsx`

Page dediee qui suit le pattern des pages existantes :

**Header** : `{flag} Cagnottes - {countryName}` avec bouton retour vers `/admin/countries/{countryCode}`

**KPIs** (cartes cliquables pour filtrer) :
- Total des cagnottes
- Actives
- Completees (target_reached)
- Expirees
- Montant total collecte

**Filtres** :
- Recherche par titre ou nom du beneficiaire
- Filtre par statut (active, target_reached, expired, cancelled)
- Filtre par occasion (anniversaire, mariage, promotion, etc.)
- Bouton export CSV

**Tableau** avec colonnes :
- Titre de la cagnotte
- Beneficiaire (via `contacts`)
- Montant actuel / Montant cible (avec barre de progression)
- Nombre de contributeurs
- Occasion
- Statut (badge colore)
- Date de creation
- Actions (voir details)

**Requete Supabase** :
```
supabase
  .from('collective_funds')
  .select('id, title, target_amount, current_amount, currency, status, occasion, created_at, deadline_date, creator_id, beneficiary_contact_id, country_code, contacts!beneficiary_contact_id(name)')
  .eq('country_code', countryCode)
  .order('created_at', { ascending: false })
```

Plus une requete pour compter les contributeurs par cagnotte via `fund_contributions`.

### 2. Modifier `src/App.tsx`

Ajouter la route :
```
/admin/countries/:countryCode/funds -> CountryFundsPage
```
Protegee par `AdminRoute`, au meme niveau que les routes users/businesses.

### 3. Modifier `src/pages/Admin/CountryDetailPage.tsx`

Rendre la carte "Cagnottes" (ligne ~324-334) cliquable avec navigation vers `/admin/countries/{countryCode}/funds`, comme les cartes Utilisateurs et Entreprises.

Ajouter `motion.div` avec les memes animations (whileHover, whileTap) et le lien "Voir details" avec la fleche.

### 4. Modifier `handleNavigate` dans CountryDetailPage

Ajouter un cas pour les cagnottes, similaire aux cas users/businesses existants.

## Fichiers impactes

- **Nouveau** : `src/pages/Admin/CountryFundsPage.tsx`
- **Modifie** : `src/App.tsx` (1 route ajoutee + import)
- **Modifie** : `src/pages/Admin/CountryDetailPage.tsx` (carte cagnottes rendue interactive)
