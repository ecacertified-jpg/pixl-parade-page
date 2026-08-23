# Synchroniser l'aperçu CSV avec le fichier exporté

Objectif : ce que la modale d'aperçu affiche doit correspondre exactement au fichier téléchargé (en-tête de contexte, colonnes, valeurs, nom de fichier).

## Écarts constatés aujourd'hui

- L'aperçu n'affiche pas l'en-tête de contexte écrit dans le CSV (titre, « Généré le », « Lignes exportées », « Colonnes exportées », « Filtres appliqués », lignes supplémentaires).
- Export « Contrôle de cohérence » : l'aperçu affiche « Filtres appliqués : Fiches analysées : N », alors que le CSV écrit cette information dans une ligne différente (`Fiches analysées`) et n'a aucune ligne « Filtres appliqués ».
- Les cellules vides sont affichées « — » dans l'aperçu alors que le CSV écrit une valeur vide.
- Le nom du fichier généré n'est jamais montré avant le téléchargement.
- L'aperçu et le téléchargement construisent chacun leur propre rendu : rien ne garantit qu'ils restent identiques dans le temps.

## Ce qui va être fait

1. **Une seule source de vérité** : une fonction unique construit le « paquet d'export » (en-tête de contexte, ligne d'en-têtes de colonnes, valeurs de toutes les lignes, nom de fichier, contenu CSV final). L'aperçu affiche ce paquet, le bouton « Confirmer et télécharger » télécharge exactement ce même contenu — plus aucun recalcul.

2. **Bloc « En-tête du fichier » dans l'aperçu** : reproduit tel quel, ligne par ligne, ce qui sera écrit en haut du CSV (titre, date de génération, nombre de lignes, nombre de colonnes, filtres, informations supplémentaires), plus le nom du fichier.

3. **Valeurs fidèles** : les cellules vides s'affichent comme « (vide) » en gris explicite au lieu de « — », et les valeurs affichées sont exactement les chaînes écrites dans le CSV (aucun formatage d'affichage supplémentaire).

4. **Cohérence de l'export cohérence** : l'information « Fiches analysées » passe par le même canal (informations supplémentaires) dans l'aperçu et dans le fichier, au lieu d'être présentée comme un filtre.

5. **Vérification intégrée** : l'aperçu indique le nombre total de lignes du fichier (lignes de contexte + en-tête + données) pour permettre un contrôle immédiat après ouverture dans Excel.

## Détails techniques

- `src/utils/exportUtils.ts` : extraire `buildExportPayload(data, columns, filenameBase, meta)` renvoyant `{ metaLines: string[][], headers: string[], rows: string[][], csv: string, filename: string }`. `arrayToCSV` et `exportToCSV` s'appuient dessus ; ajouter `downloadExportPayload(payload)`. Aucun changement de format du CSV lui-même (séparateur `;`, BOM UTF-8, échappement existant conservés).
- `src/components/admin/CsvExportPreviewDialog.tsx` : accepter un `payload` au lieu de `columns` + `rows`, afficher le bloc en-tête / nom de fichier, utiliser `payload.rows` pour l'échantillon et les taux de remplissage (mise en page mobile/desktop actuelle conservée).
- `src/pages/Admin/JdvCrmDashboard.tsx` : construire le payload dans `handleExport` et `handleExportCoherence` (avec `title`, `filters`, `extra` et le nom de fichier définitifs) ; `confirmExport` appelle uniquement `downloadExportPayload`.
- Les autres appelants de `exportToCSV` (autres écrans admin) restent inchangés.
