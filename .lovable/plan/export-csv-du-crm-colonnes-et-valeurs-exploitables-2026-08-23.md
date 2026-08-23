# Export CSV du CRM : colonnes et valeurs exploitables

## Ce qui se passe aujourd'hui (vérifié dans le code)

- `handleExport` dans `src/pages/Admin/JdvCrmDashboard.tsx` exporte bien la liste **filtrée** (`fetchCrmExport(filters)`), donc filtrer sur « Actif » exporte les bonnes fiches — mais rien dans le fichier ne le dit.
- `arrayToCSV` (`src/utils/exportUtils.ts`) écrit une seule ligne d'en-têtes de ~60 colonnes, sans regroupement ni ordre lisible : difficile d'identifier une colonne dans Excel.
- Les nombres sont formatés en `fr-FR` (espace insécable comme séparateur de milliers) : Excel les lit comme du texte, donc non exploitables en tri/filtre.
- Le nom du fichier est toujours `jdv_crm_<date>.csv`, quel que soit le filtre : impossible de distinguer deux exports.

## Ce qui sera fait

### 1. En-tête de contexte en haut du fichier
Quelques lignes avant le tableau, puis une ligne vide, puis les en-têtes de colonnes :

```text
Export JDV CRM
Généré le;23/08/2026 02:14
Fiches exportées;128
Filtres appliqués;Niveau d'activité = Actif | Pays = CI
```

Ainsi on sait immédiatement à quoi correspond le fichier.

### 2. En-têtes de colonnes préfixés par bloc thématique
Chaque en-tête devient `BLOC — Libellé`, dans un ordre stable :

`IDENTITÉ`, `LOCALISATION`, `ANNIVERSAIRE`, `PAGE`, `CAGNOTTE`, `PARTAGE`, `ACTIVITÉ`, `SEGMENTATION`, `SCORE`, `SUIVI`.

Exemples : `ACTIVITÉ — Niveau d'activité`, `SEGMENTATION — Segment (code)`, `SCORE — Score de réactivation`.

### 3. Valeurs lisibles et non ambiguës
- Toute cellule vide devient `Non disponible` (déjà le cas partiellement, généralisé).
- Booléens : `Oui` / `Non` partout.
- Nombres : écrits sans séparateur de milliers (`12500`) pour rester numériques dans Excel ; les dates restent `jj/mm/aaaa`.
- Les colonnes clés de segmentation sont dédoublées en code + libellé (`S3` et `Cagnotte créée mais non partagée`), idem pour l'activité, l'étape de parcours et le blocage.

### 4. Nom de fichier parlant
`jdv_crm_actif_CI_2026-08-23.csv` — les filtres actifs sont résumés dans le nom (segment, niveau d'activité, pays, priorité).

Le même traitement (contexte + en-têtes préfixés) est appliqué aux exports du rapport de cohérence et de l'audit S1–S8.

## Détails techniques

- `src/utils/exportUtils.ts` : ajout d'un paramètre optionnel `meta` (titre, date, nombre de lignes, filtres) à `arrayToCSV` / `exportToCSV` ; nombres exportés bruts au lieu de `formatNumberFr`.
- `src/components/admin/crm/crmExportColumns.ts` : réordonnancement, préfixes de bloc, formatteurs `Oui/Non` et `Non disponible` uniformes, colonnes code + libellé.
- `src/components/admin/crm/crmAuditColumns.ts` : mêmes préfixes de bloc.
- `src/pages/Admin/JdvCrmDashboard.tsx` : fonction de description lisible des filtres appliqués, transmise à l'export et au nom de fichier.

Aucune modification de la logique de segmentation, du scoring ou des données.
