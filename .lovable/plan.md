## Objectif

Harmoniser le formatage des dates dans toute l'application pour qu'elles soient affichées en français de manière cohérente, en ajoutant la locale `fr` (date-fns) là où elle manque encore.

## Constat de l'audit

J'ai parcouru toute la codebase à la recherche d'appels `format(...)`, `formatDistanceToNow(...)`, `formatRelative(...)` et `toLocaleDateString(...)` :

- **Bonne nouvelle** : la grande majorité des appels passent déjà `{ locale: fr }` (date-fns) ou `'fr-FR'` (API native). Les composants `BirthdayPicker`, `Calendar`, panneau de notifications, commentaires, avis, alertes, etc. sont déjà corrects.
- **Cas restants où la locale française manque** (formats lisibles avec lettres de mois/jour) :
  1. `src/components/admin/DuplicateGroupCard.tsx` ligne 149 — `format(date, 'dd/MM/yyyy')` sans `{ locale: fr }` (l'import `fr` est pourtant déjà présent ligne 3).
  2. `src/hooks/useBusinessFollowers.ts` ligne 112 — `format(day, 'EEE')` pour les libellés de l'axe X du graphique d'abonnés : actuellement en anglais (Mon, Tue…), devrait être Lun, Mar…
  3. `src/components/ui/birthday-picker.tsx` lignes 63 et 203 — `format(date, "dd/MM/yyyy")` pour l'input texte. **À conserver tel quel** : c'est un format purement numérique sans nom de mois, donc ajouter `locale: fr` n'apporte aucun changement visible. À documenter pour éviter une « correction » inutile.
  4. `src/components/ui/date-range-picker.tsx` lignes 115/126/197/202 — même cas que le birthday picker : format numérique `dd/MM/yyyy`, pas besoin de locale.

## Modifications à appliquer

### 1. `src/components/admin/DuplicateGroupCard.tsx`
Ajouter la locale française à l'unique appel `format` :
```ts
format(new Date(account.created_at), 'dd/MM/yyyy', { locale: fr })
```
(L'import est déjà en place, aucun import à ajouter.)

### 2. `src/hooks/useBusinessFollowers.ts`
- Ajouter l'import : `import { fr } from 'date-fns/locale';`
- Modifier la ligne 112 :
```ts
date: format(day, 'EEE', { locale: fr }),
```
Résultat : l'axe X du graphique « 7 derniers jours » affichera `lun.`, `mar.`, `mer.`… au lieu de `Mon`, `Tue`, `Wed`.

### 3. Convention partagée (mémoire)
Créer une nouvelle entrée mémoire `mem://ui/french-date-formatting.md` qui consolide la règle :

> Tout appel `format`, `formatDistanceToNow`, `formatRelative` de **date-fns** affichant un nom de mois (`MMM`, `MMMM`), un jour de la semaine (`EEE`, `EEEE`) ou un texte relatif **doit** passer `{ locale: fr }` (import `import { fr } from 'date-fns/locale'`).
> Tout appel `toLocaleDateString` / `toLocaleString` / `toLocaleTimeString` sur une date doit passer `'fr-FR'` en premier argument.
> **Exception** : les formats purement numériques (`dd/MM/yyyy`, `HH:mm`, `yyyy-MM-dd`) n'ont pas besoin de locale (le rendu est identique).
> Référence : composant standard `BirthdayPicker` (`src/components/ui/birthday-picker.tsx`).

## Détails techniques

- Aucune migration SQL.
- Aucune modification d'API ou de schéma.
- Pas d'impact sur les performances (date-fns tree-shake la locale).
- Pas de changement visible pour l'utilisateur sauf : (a) la date « Créé le » sur les cartes de doublons admin reste identique en surface mais devient cohérente avec le reste, (b) les libellés de jours sur le graphique des abonnés business deviennent français.

## Fichiers modifiés (résumé)

- `src/components/admin/DuplicateGroupCard.tsx` (1 ligne)
- `src/hooks/useBusinessFollowers.ts` (1 import + 1 ligne)
- `.lovable/mem/ui/french-date-formatting.md` (créé)

## Vérification post-implémentation

- Recherche finale `rg "format\([^)]*['\"][^'\"]*(MMMM|MMM|EEEE|EEE|do)[^'\"]*['\"]" src/` doit ne plus retourner de résultats sans `locale: fr`.
- Vérification TypeScript clean.
