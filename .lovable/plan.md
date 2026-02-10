

# Rendre les cartes KPI cliquables sur la page detail pays

## Objectif

Sur la page `/admin/countries/:countryCode`, rendre les 7 cartes KPI (Utilisateurs, Entreprises, Revenus, Taux de conversion, Commandes, Panier moyen, Cagnottes) cliquables. Au clic, l'admin est redirige vers la page d'administration correspondante avec le filtre pays automatiquement applique.

## Fonctionnement

Chaque carte navigue vers la page admin dediee tout en changeant le filtre pays global (`AdminCountryContext`) pour pre-filtrer les donnees du pays concerne :

| Carte | Navigation | Action |
|-------|-----------|--------|
| Utilisateurs | `/admin/users` | Filtre pays applique |
| Entreprises | `/admin/businesses` | Filtre pays applique |
| Revenus | `/admin/business-analytics` | Filtre pays applique |
| Taux de conversion | `/admin/business-analytics` | Filtre pays applique |
| Commandes | `/admin/orders` | Filtre pays applique |
| Panier moyen | `/admin/orders` | Filtre pays applique |
| Cagnottes | Reste sur la page (pas de page admin dediee) | Scroll vers la section |

## Modifications techniques

### `src/pages/Admin/CountryDetailPage.tsx`

1. Importer `useAdminCountry` depuis le contexte existant et `motion` de framer-motion
2. Creer une fonction `handleNavigate(path)` qui :
   - Appelle `setSelectedCountry(countryCode)` pour appliquer le filtre global
   - Navigue vers la page cible avec `navigate(path)`
3. Wrapper chaque `Card` dans un `motion.div` avec :
   - `whileHover={{ scale: 1.02 }}` et `whileTap={{ scale: 0.97 }}`
   - `className="cursor-pointer"`
   - `onClick={() => handleNavigate('/admin/users')}` (adapte par carte)
4. Ajouter un indicateur visuel (chevron ou texte "Voir detail") pour signaler que la carte est cliquable
5. Pour la carte Cagnottes (pas de page dediee), ne pas rendre cliquable ou ajouter un lien futur

## Impact

- 1 fichier modifie : `CountryDetailPage.tsx`
- Aucune nouvelle route ou page necessaire
- Utilise les pages admin existantes qui supportent deja le filtre via `AdminCountryContext`
- Animation coherente avec les cartes pays du dashboard principal

