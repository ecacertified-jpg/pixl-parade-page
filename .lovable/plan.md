
# Ajouter un bouton "Retour au pays" contextuel

## Objectif

Quand un filtre pays est actif (ex: Benin), afficher un bouton de retour vers la page detail du pays (`/admin/countries/BJ`) dans les pages Utilisateurs et Entreprises, pour une navigation fluide.

## Approche

Modifier le composant `AdminPageHeader` pour qu'il accepte un lien de retour dynamique. Quand `selectedCountry` est actif, les deux pages passeront `backPath={'/admin/countries/' + selectedCountry}` au lieu du `/admin` par defaut.

De plus, ajouter un petit bouton/lien contextuel sous le header (ou a cote du titre du tableau) pour revenir au pays, visible uniquement quand un filtre pays est actif. Ce bouton permettra aussi de reinitialiser le filtre pays au clic.

## Modifications

### 1. `src/pages/Admin/UserManagement.tsx`

- Rendre le `backPath` de `AdminPageHeader` dynamique :
  - Si `selectedCountry` est actif : `backPath={'/admin/countries/' + selectedCountry}`
  - Sinon : `backPath="/admin"` (defaut)
- Ajouter un bouton "Retour au pays" compact entre le header et le tableau, visible uniquement quand `selectedCountry` est non-null. Ce bouton naviguera vers `/admin/countries/:code` et appellera `setSelectedCountry(null)` pour nettoyer le filtre.

### 2. `src/pages/Admin/BusinessManagement.tsx`

- Meme logique : `backPath` dynamique sur `AdminPageHeader`
- Meme bouton contextuel "Retour au pays" entre le header et le tableau

### 3. Detail du bouton contextuel

```
[← Retour a 🇧🇯 Benin]     [✕ Effacer le filtre pays]
```

- Bouton gauche : navigue vers `/admin/countries/BJ`
- Bouton droit : efface le filtre (`setSelectedCountry(null)`) et reste sur la page courante pour voir tous les pays

## Impact

- 2 fichiers modifies : `UserManagement.tsx` et `BusinessManagement.tsx`
- Aucun nouveau composant necessaire
- Navigation contextuelle et intuitive entre les vues pays et les listes globales
