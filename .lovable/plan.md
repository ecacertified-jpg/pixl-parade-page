# Aperçu CSV — affichage mobile harmonieux

La modale d'aperçu avant export (`CsvExportPreviewDialog`) garde une mise en page pensée pour le desktop : elle est large, l'échantillon est un tableau à 30+ colonnes en `whitespace-nowrap`, et les boutons du pied de page restent côte à côte. Sur téléphone, cela produit du débordement horizontal et des zones de texte serrées.

## Constat (code actuel)

- `DialogContent` : `w-[95vw] max-w-4xl` avec `overflow-y-auto` — le contenu interne large pousse la largeur.
- Liste des colonnes : chaque ligne aligne libellé + badge « X/Y renseignées » sur une même rangée, texte réduit.
- Échantillon : `Table` avec toutes les colonnes en `whitespace-nowrap` → double scroll horizontal (modale + tableau).
- `DialogFooter` : deux boutons alignés, non pleine largeur sur mobile.
- En-têtes de sections et badges en taille desktop.

## Ce qui va changer (présentation uniquement)

1. **Conteneur de la modale**
   - Sur mobile : quasi plein écran (`h-[92vh]`, largeur `100vw` moins une petite marge), padding réduit, en-tête et pied fixes avec zone centrale défilante verticalement.

2. **Bandeau de synthèse**
   - Badges (lignes / colonnes / colonnes vides) qui passent à la ligne proprement, taille `text-[10px]` sur mobile.
   - Bloc « Filtres appliqués » en pleine largeur, texte qui se coupe correctement.

3. **Liste des colonnes**
   - Sur mobile : une colonne — libellé sur sa ligne, exemple en dessous, badge de remplissage aligné à gauche en dessous plutôt qu'à droite.
   - Hauteur de la zone défilante adaptée (`max-h-52` mobile / `max-h-64` au-delà), champ de recherche en hauteur confortable (≥ 44 px).

4. **Échantillon de lignes**
   - Sur mobile : remplacement du tableau par des **cartes empilées** — une carte par ligne d'exemple, avec paires « Colonne : valeur », les valeurs vides affichées `—`, et un repli « Afficher toutes les colonnes » pour éviter des cartes trop longues.
   - À partir de `md` : tableau actuel inchangé, avec scroll horizontal.

5. **Pied de page**
   - Boutons empilés en pleine largeur sur mobile (Confirmer en premier visuellement), côte à côte à partir de `sm`.

## Détails techniques

- Fichier concerné : `src/components/admin/CsvExportPreviewDialog.tsx` uniquement.
- Utilisation du breakpoint `md` via classes Tailwind responsives et, si besoin, `useIsMobile` (`src/hooks/use-mobile.tsx`) pour le rendu conditionnel cartes/tableau.
- Aucune modification des colonnes d'export, de `getExportCellValue`, de `exportUtils.ts` ni de la logique CRM.
- Tokens sémantiques du design system uniquement (aucune couleur en dur).
- Vérification finale sur viewport 390 px via capture Playwright de la modale d'aperçu.
