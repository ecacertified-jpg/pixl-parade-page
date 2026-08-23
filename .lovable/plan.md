# Affichage mobile harmonieux — Module CRM utilisateurs

Objectif : rendre la page `JDV_CRM — Comportement des utilisateurs` lisible et confortable sur téléphone, sans changer la logique CRM (segments, scores, audits, exports restent identiques).

## Constat actuel (page admin CRM)

- Les 7 cartes KPI passent en 2 colonnes sur mobile : chiffres et libellés serrés.
- Le tableau « Fiches utilisateurs » compte 13 colonnes : sur téléphone il impose un long défilement horizontal et devient illisible.
- Le bloc « Filtres » empile 9 contrôles pleine hauteur : la page devient très longue avant d'atteindre les résultats.
- Les lignes de contrôle T1→T12 et le panneau d'audit alignent libellé + détail sur une seule ligne : le texte se comprime.
- L'en-tête de page et les titres de cartes gardent des tailles desktop.

## Ce qui va changer

1. **En-tête et titres**
   - Titre et description en taille réduite sur mobile, espacement vertical resserré (`space-y-4` sur mobile, `space-y-6` au-delà).

2. **Cartes KPI**
   - Sur mobile : bandeau défilant horizontalement (snap) ou grille 2 colonnes compacte avec padding réduit, icône + libellé sur une ligne, chiffre en `text-xl`.
   - Le libellé passe sur deux lignes sans être tronqué.

3. **Niveau d'activité / Parcours de conversion / Segmentation**
   - Boutons en une colonne sur mobile, hauteur de frappe confortable (min 44px), texte aligné et taille homogène.
   - Barres du funnel plus épaisses et valeurs alignées à droite.

4. **Filtres — repliables sur mobile**
   - La recherche reste toujours visible.
   - Les 8 autres filtres sont regroupés dans un bloc repliable (`Collapsible`) fermé par défaut sur mobile, ouvert sur desktop, avec un compteur « N filtres actifs ».
   - Le bouton d'export et « Réinitialiser » passent en pleine largeur sur mobile.

5. **Fiches utilisateurs — cartes au lieu du tableau sur mobile**
   - En dessous de `md`, chaque utilisateur est rendu comme une carte cliquable : nom + identifiant en tête, badges Segment / Priorité / Score, puis une ligne compacte d'indicateurs (Anniv., Page, Cagnotte, Partage, Activité) et une ligne Blocage / Statut.
   - Le tableau complet reste inchangé à partir de `md`.
   - Pagination : boutons pleine largeur, page centrée.

6. **Contrôle de cohérence et audit des segments**
   - Lignes en colonne sur mobile (icône + ID + libellé sur une ligne, détail en dessous en petit).
   - En-têtes de cartes : titre et bouton d'export empilés sur mobile.
   - Tableau d'audit : mêmes règles que les fiches (cartes compactes sur mobile, tableau au-delà).

7. **Fiche individuelle (`CrmUserSheet`, panneau « Pourquoi »)**
   - Sheet en pleine largeur sur mobile, contenu en une colonne, badges qui passent à la ligne, accordéon du panneau « Pourquoi » avec textes adaptés.

## Détails techniques

- Fichiers concernés : `src/pages/Admin/JdvCrmDashboard.tsx`, `src/components/admin/crm/CrmSegmentAuditPanel.tsx`, `src/components/admin/crm/CrmUserSheet.tsx`, `src/components/admin/crm/CrmWhyPanel.tsx`.
- Uniquement du travail de présentation : classes Tailwind responsives, `useIsMobile` / breakpoint `md` pour basculer tableau ↔ cartes, `Collapsible` shadcn pour les filtres.
- Aucune modification des hooks (`useJdvCrm`), de `crmCore.ts`, des colonnes d'export ni des requêtes SQL.
- Tokens sémantiques du design system uniquement (aucune couleur en dur).
- Vérification finale sur viewport mobile (390px) via capture Playwright de la page CRM.
