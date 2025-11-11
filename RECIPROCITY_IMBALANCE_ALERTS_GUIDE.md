# Guide du Système d'Alertes de Déséquilibre de Réciprocité

## Vue d'ensemble

Le système d'alertes de déséquilibre de réciprocité détecte automatiquement les utilisateurs qui reçoivent beaucoup de contributions mais n'en font jamais ou très peu. Il alerte les administrateurs pour qu'ils puissent prendre des mesures correctives et maintenir un écosystème d'entraide équilibré.

## Fonctionnement

### 1. Détection Automatique (Quotidienne)

L'edge function `detect-reciprocity-imbalance` s'exécute automatiquement **chaque jour à 2h du matin** via un cron job Supabase.

**Critères de détection d'un déséquilibre sévère :**
- **Critère 1**: L'utilisateur a reçu plus de 25 000 XOF mais a contribué moins de 5 000 XOF
- **Critère 2**: Le ratio (reçu / donné) est supérieur à 5 ET l'utilisateur a reçu plus de 15 000 XOF

### 2. Niveaux de Sévérité

Le système classe automatiquement les alertes selon leur sévérité :

| Niveau | Ratio | Icône | Description |
|--------|-------|-------|-------------|
| **Critical** | > 10x | 🚨 | Déséquilibre critique nécessitant une action immédiate |
| **High** | 7-10x | ⚠️ | Déséquilibre important à surveiller de près |
| **Medium** | 4-7x | ⚡ | Déséquilibre notable à surveiller |
| **Low** | < 4x | ℹ️ | Déséquilibre mineur |

### 3. Actions Recommandées Automatiques

Le système génère automatiquement des recommandations selon le profil :

- **Aucune contribution** (0 contributions données)
  → "Contacter l'utilisateur pour encourager la participation communautaire"

- **Peu de contributions** (< 5 000 XOF)
  → "Envoyer une notification rappelant l'importance de la réciprocité"

- **Contributions insuffisantes** (≥ 5 000 XOF mais ratio élevé)
  → "Surveiller l'activité et envoyer un rappel personnalisé"

## Interface Administrateur

### Accès

Les alertes sont accessibles via :
**Admin Panel → Réciprocité → Section "Alertes de Déséquilibre"**

### Onglets de Gestion

1. **En attente** : Alertes nouvellement créées nécessitant un examen
2. **Examinées** : Alertes vues par un administrateur
3. **Résolues** : Alertes où une action corrective a été prise
4. **Rejetées** : Alertes jugées non pertinentes ou faux positifs

### Informations Affichées

Pour chaque alerte :
- **Identité** : Nom et avatar de l'utilisateur
- **Statistiques** :
  - Montant total reçu
  - Montant total contribué
  - Nombre de contributions reçues
  - Nombre de contributions données
  - Ratio de déséquilibre
  - Jours depuis la dernière contribution
- **Action recommandée**
- **Notes administratives** (après examen)

### Actions Disponibles

#### Détails
Ouvre une vue détaillée avec toutes les informations et statistiques.

#### Examiner
Marque l'alerte comme "examinée" après avoir pris connaissance.

#### Résoudre
Marque l'alerte comme "résolue" après avoir pris une action corrective :
- Contact avec l'utilisateur
- Envoi de notifications
- Application de mesures

#### Rejeter
Marque l'alerte comme non pertinente si :
- Faux positif
- Situation justifiée
- Autre raison valide

## Base de Données

### Table : `reciprocity_imbalance_alerts`

```sql
CREATE TABLE reciprocity_imbalance_alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'severe_imbalance',
  severity TEXT NOT NULL (low|medium|high|critical),
  total_received NUMERIC NOT NULL,
  total_contributed NUMERIC NOT NULL,
  imbalance_ratio NUMERIC NOT NULL,
  contributions_received_count INTEGER NOT NULL,
  contributions_given_count INTEGER NOT NULL,
  days_since_last_contribution INTEGER,
  recommended_action TEXT,
  status TEXT NOT NULL (pending|reviewed|resolved|dismissed),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);
```

### RLS Policies

- **Lecture** : Réservée aux administrateurs actifs
- **Mise à jour** : Réservée aux administrateurs actifs
- **Insertion** : Autorisée pour le système (fonction automatique)

## Configuration du Cron Job

Le cron job est configuré pour s'exécuter quotidiennement :

```sql
SELECT cron.schedule(
  'detect-reciprocity-imbalance-daily',
  '0 2 * * *', -- Tous les jours à 2h du matin
  $$
  SELECT net.http_post(
    url:='https://[PROJECT_REF].supabase.co/functions/v1/detect-reciprocity-imbalance',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Vérifier le Cron Job

```sql
SELECT * FROM cron.job WHERE jobname = 'detect-reciprocity-imbalance-daily';
```

### Voir l'historique d'exécution

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'detect-reciprocity-imbalance-daily')
ORDER BY start_time DESC
LIMIT 10;
```

## Edge Function

### Localisation
`supabase/functions/detect-reciprocity-imbalance/index.ts`

### Fonctionnement

1. **Analyse des scores de réciprocité** pour tous les utilisateurs
2. **Calcul des contributions reçues** via `reciprocity_tracking`
3. **Identification des déséquilibres** selon les critères définis
4. **Création d'alertes** pour les nouveaux cas (pas de duplication)
5. **Classification par sévérité**
6. **Génération de recommandations**

### Logs

Les logs de l'edge function sont visibles dans :
**Supabase Dashboard → Edge Functions → detect-reciprocity-imbalance → Logs**

## Workflow Recommandé

### 1. Revue Quotidienne (Administrateur)
- Consulter les nouvelles alertes dans l'onglet "En attente"
- Évaluer la sévérité et le contexte
- Ajouter des notes si nécessaire

### 2. Actions Correctives
Pour les alertes **Critical** et **High** :
- Contacter l'utilisateur (email, notification in-app)
- Expliquer l'importance de la réciprocité
- Encourager la participation communautaire
- Proposer des cagnottes auxquelles contribuer

Pour les alertes **Medium** :
- Envoyer des notifications automatiques
- Surveiller l'évolution

Pour les alertes **Low** :
- Surveillance passive
- Attendre l'évolution naturelle

### 3. Suivi
- Marquer comme "Examinée" après première revue
- Marquer comme "Résolue" après action corrective réussie
- Marquer comme "Rejetée" si non pertinente

## Métriques de Performance

### Indicateurs à Surveiller

1. **Taux de déséquilibre** : % d'utilisateurs avec alertes actives
2. **Taux de résolution** : % d'alertes résolues vs créées
3. **Temps moyen de résolution** : Délai entre création et résolution
4. **Taux de récurrence** : % d'utilisateurs avec alertes répétées

### Objectifs Recommandés

- Maintenir < 5% d'utilisateurs avec déséquilibres sévères
- Résoudre 80%+ des alertes Critical en < 7 jours
- Résoudre 70%+ des alertes High en < 14 jours

## Évolutions Futures

### Améliorations Possibles

1. **Notifications Automatiques** : Envoyer automatiquement des rappels aux utilisateurs concernés
2. **Score de Santé Communautaire** : Dashboard global de l'équilibre de l'écosystème
3. **Prédiction de Risques** : ML pour identifier les utilisateurs à risque avant déséquilibre
4. **Gamification** : Badges et récompenses pour encourager la réciprocité
5. **Alertes Temps Réel** : Notifications immédiates pour les cas critiques
6. **Rapports Hebdomadaires** : Synthèse automatique pour les admins

## Support

Pour toute question ou problème :
1. Consulter les logs de l'edge function
2. Vérifier l'état du cron job
3. Examiner les données dans la table `reciprocity_imbalance_alerts`
4. Contacter l'équipe technique si nécessaire
