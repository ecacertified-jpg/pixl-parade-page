---
name: Formatage des dates en français
description: Toutes les dates affichées doivent passer la locale française (date-fns `fr` ou `'fr-FR'`)
type: preference
---
Tout appel `format`, `formatDistanceToNow`, `formatRelative` de **date-fns** affichant un nom de mois (`MMM`, `MMMM`), un jour de la semaine (`EEE`, `EEEE`) ou un libellé relatif **doit** passer `{ locale: fr }` (import : `import { fr } from 'date-fns/locale'`).

Tout appel natif `toLocaleDateString` / `toLocaleString` / `toLocaleTimeString` sur une date doit passer `'fr-FR'` en premier argument.

**Exception** : les formats purement numériques (`dd/MM/yyyy`, `HH:mm`, `yyyy-MM-dd`) n'ont **pas besoin** de locale — le rendu est identique. Ne pas ajouter `{ locale: fr }` dans ces cas pour garder le code propre.

**Référence** : composant standard `BirthdayPicker` (`src/components/ui/birthday-picker.tsx`) et `Calendar` (shadcn) qui passent `locale={fr}`.

Audit rapide pour vérifier qu'aucun format lisible n'a oublié la locale :
```bash
rg "format\([^)]*['\"][^'\"]*(MMMM|MMM|EEEE|EEE|do)[^'\"]*['\"]" src/ | rg -vF "locale: fr"
```
Cette commande ne doit retourner aucun résultat.