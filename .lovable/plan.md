

# Anniversaires Admin — Vue complète avec filtres par période et par mois

## Objectif

Créer une nouvelle page admin `/admin/birthdays` permettant aux administrateurs de consulter tous les anniversaires des contacts (et profils utilisateurs) avec des filtres prédéfinis par période et par mois.

## Filtres demandés

**Par période :**
- Jour J (aujourd'hui)
- 3 prochains jours
- 7 prochains jours
- 10 prochains jours
- 15 prochains jours
- 20 prochains jours
- 25 prochains jours
- 30 prochains jours

**Par mois :**
- Janvier à Décembre (sélection du mois calendaire)

## Architecture

### 1. Nouveau hook : `src/hooks/useAdminBirthdays.ts`
- Requête admin sur les tables `profiles` (anniversaires utilisateurs) et `contacts` (anniversaires contacts)
- Filtre par `country_code` via `useAdminCountry` (cohérent avec le reste de l'admin)
- Charge tous les profils/contacts avec birthday non null
- Calcule `daysUntil` via `getDaysUntilBirthday` existant
- Filtre côté client selon le mode sélectionné (période en jours ou mois spécifique)
- Retourne les données triées par `daysUntil` ou par jour du mois

### 2. Nouvelle page : `src/pages/Admin/AdminBirthdays.tsx`
- Wrapped dans `AdminLayout`
- **Section filtres** : 
  - Rangée de boutons pour les périodes (Jour J, 3j, 7j, 10j, 15j, 20j, 25j, 30j)
  - Select dropdown pour filtrer par mois (Janvier–Décembre)
  - Les deux filtres sont mutuellement exclusifs (sélectionner un mois désactive le filtre période et vice-versa)
- **Tableau des résultats** : Nom, Date d'anniversaire, Jours restants, Type (Utilisateur/Contact), Propriétaire du contact
- **KPI cards en haut** : Total aujourd'hui, Total cette semaine, Total ce mois
- **Badge** sur chaque ligne : couleur selon urgence (rouge = aujourd'hui, orange = ≤3j, jaune = ≤7j, gris = reste)
- Filtre pays via `AdminCountrySelector` déjà intégré dans le layout

### 3. Route et navigation
- **Route** : `/admin/birthdays` dans `App.tsx`, protégée par `AdminRoute`
- **Menu** : Ajouter dans `AdminLayout.tsx` navItems avec icône `Cake` et titre "Anniversaires"

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `src/hooks/useAdminBirthdays.ts` | Créer — hook de données |
| `src/pages/Admin/AdminBirthdays.tsx` | Créer — page complète |
| `src/App.tsx` | Modifier — ajouter route |
| `src/components/AdminLayout.tsx` | Modifier — ajouter lien nav |

Aucune migration DB nécessaire — les données birthday existent déjà dans `profiles` et `contacts`.

