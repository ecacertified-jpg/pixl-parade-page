# Module JDV_CRM — Analyse et plan

## 1. Analyse de l'architecture actuelle (vérifiée en base)

Données déjà disponibles, réutilisables telles quelles :

| Besoin CRM | Source existante | Volume actuel |
|---|---|---|
| Identité (prénom, nom, téléphone, ville, pays, date d'inscription, anniversaire) | `profiles` (1 114 lignes) | OK |
| Email | `auth.users.email` (1 119 comptes) — non présent dans `profiles` | OK via service role |
| Dernière connexion | `auth.users.last_sign_in_at` + `user_session_logs` (11 404 lignes) | OK |
| Sessions / activité | `user_session_logs` (started_at, last_active_at, durée) | OK |
| Page anniversaire | `birthday_pages` (431) : slug, is_active, published_at, created_at | OK |
| Page événement | `event_pages` (1) : slug, occasion, event_date | OK |
| Cagnottes | `collective_funds` (14) : status, target/current_amount, creator_id, beneficiary_user_id | OK |
| Contributions | `fund_contributions` (22) | OK |
| Partages | `viral_share_events` (4, canal + page) et `onboarding_shares` (13) | Faible volume mais exploitable |
| Messages reçus | `birthday_wishes_messages` (70) | OK |
| Doublons | `detected_duplicate_accounts` (10) déjà alimentée | Réutilisée |
| Progression parcours | `profiles.onboarding_furthest_step`, `onboarding_completed` | OK |
| Rôles admin | `admin_users` (rôles, `assigned_countries`) + `AdminRoute` / `useAdmin` | Réutilisés |

Données **manquantes ou partielles** — signalées, jamais inventées :

- **Vues de page** : pas de table de vues pour les pages anniversaire/événement (seulement `birthday_page_photo_views` sur les photos, 160 lignes). L'indicateur « nombre de vues de la page » sera affiché comme **Non disponible**, sauf approximation photos affichée explicitement comme telle.
- **Partages** : `viral_share_events` n'a que 4 lignes ; beaucoup d'utilisateurs apparaîtront « partage non détecté ». C'est un manque de tracking historique, pas une erreur du CRM.
- **Ville** : présente dans `profiles.city` mais souvent vide.
- **Pays** : `profiles.country_code` (CI, BJ, SN, TG, ML, BF).

Aucune donnée existante ne sera modifiée ou écrasée. Le CRM est une **couche de lecture + tables CRM dédiées**.

## 2. Ce qui sera créé

### Nouvelles tables (préfixées `crm_`, isolées des données sources)

- `crm_profiles` — 1 ligne par utilisateur : `crm_id` (JDV-000125, unique et stable, séquence), `user_id`, `statut_reactivation`, `statut_doublon`, notes admin, `assigned_admin_id`. Seuls les champs pilotés par l'équipe y sont stockés ; l'identité reste lue depuis `profiles`.
- `crm_reactivation_history` — historique : date, canal, campagne, message/cause, statut, réponse, action suivante, résultat, admin auteur.
- `crm_scoring_rules` — pondérations du score en base (clé, libellé, points, actif), donc modifiables sans redéploiement. Seed avec les valeurs demandées (+30 anniversaire proche, +25 page créée, +20 activité récente, +15 cagnotte, +10 partage, +10 interaction récente, −10 inactif 30j, −20 inactif 90j).

RLS : accès réservé aux admins actifs (`admin_users`), aucune exposition publique. Grants `authenticated` + `service_role` uniquement.

### Vue de calcul

Une vue SQL `crm_user_overview` agrège par utilisateur : identité, page(s), cagnotte(s), partages, messages, sessions, dernière activité, jours depuis dernière activité, jours avant prochain anniversaire. Segment, score et priorité sont **calculés dynamiquement** à chaque lecture — donc toujours à jour quand l'utilisateur agit (S4 → S2 → S3 → S7 automatiquement).

### Edge Function `admin-crm`

Actions : `list` (filtres + pagination + tri), `detail` (fiche complète + historique + détail du score), `stats` (KPIs), `export`, `set_status`, `add_history`, `flag_duplicate`. Vérifie le JWT et le rôle admin, filtre par `assigned_countries` pour les admins régionaux, et joint l'email depuis `auth.users` (service role). Réponses JSON structurées, réutilisables plus tard par un agent IA.

### Interface `/admin/crm` (entrée « CRM » dans la sidebar admin)

1. **Tableau de bord** : total utilisateurs, Côte d'Ivoire, Bénin (et autres pays), doublons potentiels, anniversaires proches, sans page, page sans cagnotte, cagnotte non partagée, inactifs, priorité très haute, à contacter, convertis après réactivation.
2. **Barre de segments cliquables** S1→S8 avec compteurs.
3. **Recherche** (nom, prénom, téléphone, email, CRM ID, User ID) et **filtres combinables** : pays, ville, période d'inscription, période d'anniversaire, segment, plage de score, priorité, page créée, cagnotte créée, page partagée, activité, statut de réactivation, statut de doublon.
4. **Tableau** : CRM ID, nom, pays, segment, score, priorité, prochaine action, statut de réactivation, dernière activité.
5. **Fiche individuelle** (panneau latéral) : Identité / Anniversaire-Événement / Comportement JDV / Score détaillé (liste des facteurs +/−) / Prochaine action / Statut de réactivation modifiable / Historique de réactivation (ajout d'entrée) / Doublons potentiels détectés avec validation humaine.
6. **Export CSV** : fiche individuelle, sélection filtrée, ou export complet — via `exportUtils.ts` existant (UTF-8 BOM, séparateur `;`, compatible Excel/Sheets).

Toute donnée absente en base s'affiche « Non disponible » ou « Date inconnue ».

## 3. Règles métier implémentées

- **Segments** S1→S8 exactement selon les définitions fournies, évalués dans cet ordre de priorité ; S8 si les données sont insuffisantes (pas de segment forcé).
- **Priorité** dérivée du segment et de la proximité de l'anniversaire (TRÈS HAUTE / HAUTE / MOYENNE / BASSE / À ANALYSER).
- **Score** 0–100, borné, calculé depuis `crm_scoring_rules`, avec détail des facteurs affiché.
- **Prochaine action** déterminée par le segment.
- **Doublons** : réutilisation de `detected_duplicate_accounts` + détection complémentaire (téléphone normalisé, email, nom+prénom) en lecture seule. Aucune suppression automatique ; validation humaine uniquement.

## 4. Périmètre exclu de cette phase

Aucun envoi de message, aucune campagne automatique, aucun agent IA — uniquement la base CRM, mesurable et exportable.

## 5. Ordre d'implémentation

1. Migration SQL : tables `crm_*`, séquence CRM ID, vue d'agrégation, RLS + grants, seed des règles de score.
2. Edge Function `admin-crm`.
3. Hook `useCrm` + page `JdvCrmDashboard` + fiche latérale + export CSV.
4. Route `/admin/crm` et entrée de menu dans `AdminLayout`.
