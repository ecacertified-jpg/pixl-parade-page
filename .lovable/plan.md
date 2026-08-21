# Audit de cohérence des segments S1–S8 (lecture seule)

## Constat de départ (vérifié dans le code)

Dans `src/lib/crmCore.ts`, le segment est attribué par une cascade `if / else if` dans l'ordre S1 → S8. Par construction, un utilisateur ne reçoit donc qu'un seul segment. Ce que l'audit doit révéler n'est pas un « double segment » mais :

- les utilisateurs qui satisfont **les conditions** de plusieurs segments (chevauchement de règles, normal mais à documenter) ;
- les cas où le segment affiché ne correspond pas au segment attendu par la règle de priorité ;
- les segments inconnus, absents, ou les fiches à données insuffisantes.

## Ce qui sera construit

### 1. Moteur d'audit (aucune écriture, aucune correction)

Nouvelle fonction dans `crmCore.ts` qui, pour chaque fiche déjà calculée, évalue **indépendamment** les huit prédicats S1…S8 sur les mêmes champs que la segmentation, puis produit :

- `crm_id`, nom complet, `user_id`
- `segment_actuel`
- `conditions_satisfaites` (liste, ex. « S1 + S2 »)
- `regles_declenchees` (libellé exact de la règle de chaque segment satisfait, avec les valeurs des champs utilisés)
- `segment_attendu` = premier segment satisfait dans l'ordre S1 > S2 > … > S8
- `ecart` (Oui / Non)
- `type_anomalie` : Aucune | Segment incohérent | Segment inconnu | Segment absent | Données insuffisantes | Interprétations multiples
- `action_recommandee` (texte, jamais appliqué automatiquement)

Règles évaluées (identiques à la segmentation actuelle) :

```text
S1 anniversaire connu et jours_avant <= 30 et pas de cagnotte
S2 au moins une page et pas de cagnotte
S3 cagnotte existante et aucun partage détecté
S4 aucune page
S5 activité réelle non récente (> 30 jours, jamais actif ou inconnue)
S6 activité récente et pas de cagnotte
S7 activité récente et cagnotte existante
S8 aucun signal exploitable (ni anniversaire, ni page, ni cagnotte, ni partage, ni session, ni connexion)
```

Un résumé est calculé : total audité, conformes, anomalies, cas nécessitant correction, répartition des anomalies par segment.

### 2. Panneau « Audit de segmentation S1–S8 » dans le dashboard

Ajouté sous le panneau « Contrôle de cohérence » de `src/pages/Admin/JdvCrmDashboard.tsx` :

- bandeau de résultat final : « AUDIT TERMINÉ — X utilisateurs présentent une incohérence de segmentation » ou « AUDIT TERMINÉ — aucune incohérence détectée » ;
- cartes de résumé (total, conformes, anomalies, à corriger) ;
- répartition des anomalies par segment ;
- tableau paginé des cas : CRM ID | Utilisateur | Segment actuel | Conditions détectées | Segment attendu | Écart | Action recommandée, avec filtre « anomalies uniquement / tous » ;
- détail des règles déclenchées au clic sur une ligne ;
- export CSV de l'audit via `exportToCSV`.

L'audit s'exécute automatiquement après le chargement des données CRM, comme le rapport T1–T12.

## Garanties

- Aucune donnée utilisateur, aucun segment, aucun statut n'est modifié : l'audit lit le dataset déjà chargé en mémoire.
- Aucune migration SQL, aucune nouvelle table, aucune correction automatique.

## Détails techniques

- `src/lib/crmCore.ts` : `evaluateSegmentConditions()`, `auditSegmentation()`, types `SegmentAuditRow` / `SegmentAuditReport`.
- `src/hooks/useJdvCrm.ts` : expose `segment_audit` calculé sur les mêmes `CrmComputed` que les cartes et la liste.
- `src/pages/Admin/JdvCrmDashboard.tsx` : nouveau panneau repliable + tableau + export.
- `src/components/admin/crm/crmAuditColumns.ts` : colonnes CSV de l'audit.
