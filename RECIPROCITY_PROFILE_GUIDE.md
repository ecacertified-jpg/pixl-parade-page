# Guide du Tableau de Bord de Réciprocité Personnel

## Vue d'Ensemble

Le tableau de bord personnel de réciprocité permet à chaque utilisateur de suivre et d'améliorer son impact dans la communauté JOIE DE VIVRE. Il offre une vue complète de leur score, historique, relations et suggestions d'amélioration.

## Accès

Les utilisateurs peuvent accéder à leur profil de réciprocité de deux façons :
1. Via le bouton "Voir mon profil" dans leur tableau de bord principal (Dashboard)
2. Directement via l'URL : `/reciprocity-profile`

## Sections du Tableau de Bord

### 1. Vue d'Ensemble (Overview)

**Contenu :**
- Badge de réciprocité actuel avec animation
- Score de réciprocité global
- Nombre de contributions données et reçues
- Nombre de relations d'échange
- Carte de progression vers le prochain badge
- Statistiques détaillées des contributions :
  - Total donné et nombre de contributions
  - Total reçu et nombre reçu
  - Balance nette (différence entre donné et reçu)
- Aperçu du réseau :
  - Relations totales
  - Relations équilibrées
  - Relations où l'utilisateur donne plus
  - Relations où l'utilisateur reçoit plus

### 2. Historique Complet

**Contenu :**
- Deux onglets : "Données" et "Reçues"
- **Contributions données :**
  - Liste chronologique de toutes les contributions
  - Détails : titre de la cagnotte, occasion, bénéficiaire, date, montant
  - Total cumulé donné
- **Contributions reçues :**
  - Liste chronologique de toutes les contributions reçues
  - Détails : titre de la cagnotte, occasion, contributeur (ou "Anonyme"), date, montant
  - Total cumulé reçu

### 3. Relations d'Échange

**Contenu :**
- Liste détaillée de toutes les relations d'échange
- Pour chaque relation :
  - Avatar et nom de la personne
  - Badge de type de relation :
    - "Équilibré" (vert) : ratio équilibré entre donné et reçu
    - "Vous donnez plus" (bleu) : vous avez donné plus que reçu
    - "Vous recevez plus" (orange) : vous avez reçu plus que donné
  - Barre de progression visuelle montrant la balance
  - Montants détaillés donnés et reçus
  - Nombre de contributions données et reçues
  - Différence nette en XOF

**Critères de classification :**
- **Équilibré** : ratio entre 0.67 et 1.5
- **Vous donnez plus** : ratio > 1.5
- **Vous recevez plus** : ratio < 0.67

### 4. Suggestions Personnalisées

**Système intelligent de recommandations basé sur :**

**Types de suggestions :**

1. **Fréquence** (Impact fort)
   - Si < 5 contributions : encouragement à augmenter la fréquence
   - Action : redirection vers les cagnottes publiques

2. **Réciprocité** (Impact fort)
   - Si relations déséquilibrées : rappel de rendre la pareille
   - Détection automatique des personnes ayant contribué sans retour

3. **Progression de Badge** (Impact moyen)
   - Affichage des points manquants pour le prochain niveau
   - Encouragement ciblé selon le badge actuel

4. **Diversité du Réseau** (Impact moyen)
   - Si < 5 relations : suggestion d'élargir le réseau
   - Action : redirection vers l'ajout d'amis

5. **Création de Cagnottes** (Impact moyen)
   - Encouragement à initier des cagnottes pour renforcer les liens

6. **Renforcement Positif** (Impact faible)
   - Pour les utilisateurs avec score ≥ 50
   - Reconnaissance de leur contribution à la communauté

**Chaque suggestion affiche :**
- Icône selon la catégorie
- Titre et description claire
- Badge d'impact (fort/moyen/faible)
- Bouton d'action quand applicable

**Conseils généraux inclus :**
- Contribuer régulièrement
- Varier les occasions
- Maintenir l'équilibre de réciprocité
- Créer des cagnottes pour les proches
- Rester actif dans la communauté

### 5. Collection de Badges

Affiche la collection complète des badges de réciprocité disponibles avec :
- Badge actuel mis en évidence
- Progression vers le prochain niveau
- Tous les badges avec leur description et avantages
- État de déblocage de chaque badge

## Architecture Technique

### Composants Créés

1. **`src/pages/ReciprocityProfile.tsx`**
   - Page principale du profil de réciprocité
   - Gestion des onglets et de la navigation
   - Header avec statistiques clés

2. **`src/hooks/useReciprocityHistory.ts`**
   - Hook personnalisé pour récupérer l'historique complet
   - Types : `ContributionHistory`, `ReceivedContribution`, `ReciprocityRelation`
   - Calculs automatiques des balances et types de relations

3. **`src/components/reciprocity/ReciprocityHistorySection.tsx`**
   - Affichage de l'historique avec onglets
   - Scroll area pour grandes listes
   - Formatage des dates et montants

4. **`src/components/reciprocity/ReciprocityRelationsSection.tsx`**
   - Visualisation des relations d'échange
   - Barres de progression pour la balance
   - Classification automatique des relations

5. **`src/components/reciprocity/ReciprocityImprovementSuggestions.tsx`**
   - Génération intelligente de suggestions
   - Animations avec framer-motion
   - Boutons d'action contextuelle

### Intégration dans l'Application

**Route ajoutée dans `src/App.tsx` :**
```tsx
<Route path="/reciprocity-profile" element={
  <ProtectedRoute>
    <ReciprocityProfile />
  </ProtectedRoute>
} />
```

**Accès depuis le Dashboard :**
Bouton ajouté dans `src/pages/Dashboard.tsx` à côté du badge de réciprocité.

## Base de Données

### Tables Utilisées

1. **`reciprocity_scores`**
   - Score de générosité de l'utilisateur
   - Compteurs de contributions
   - Badge level actuel

2. **`fund_contributions`**
   - Toutes les contributions données et reçues
   - Montants, dates, anonymat

3. **`collective_funds`**
   - Détails des cagnottes (titre, occasion)
   - Créateurs et bénéficiaires

4. **`profiles`**
   - Informations utilisateur (nom, avatar)

### Requêtes Principales

**Contributions données :**
```sql
SELECT fc.*, cf.title, cf.occasion, p.first_name, p.last_name
FROM fund_contributions fc
JOIN collective_funds cf ON fc.fund_id = cf.id
JOIN profiles p ON cf.creator_id = p.id
WHERE fc.contributor_id = [user_id]
```

**Contributions reçues :**
```sql
SELECT fc.*, cf.title, cf.occasion, p.first_name, p.last_name
FROM fund_contributions fc
JOIN collective_funds cf ON fc.fund_id = cf.id
JOIN profiles p ON fc.contributor_id = p.id
WHERE cf.creator_id = [user_id]
```

## Calculs et Logique

### Type de Relation

Le type de relation est déterminé par le ratio :
```
ratio = montant_donné / montant_reçu

Si ratio > 1.5 : "Vous donnez plus"
Si ratio < 0.67 : "Vous recevez plus"
Sinon : "Équilibré"
```

### Suggestions Personnalisées

Les suggestions sont générées dynamiquement selon :
- Nombre de contributions (`contributionsGiven`)
- Balance de réciprocité (`relations` déséquilibrées)
- Score actuel (`currentScore`)
- Taille du réseau (`relations.length`)

## Design et UX

### Couleurs Sémantiques

- **Vert** : Relations équilibrées, montants reçus
- **Bleu** : Relations où l'utilisateur donne plus
- **Orange** : Relations où l'utilisateur reçoit plus
- **Rouge** : Suggestions à fort impact
- **Primaire** : Scores, contributions données

### Responsive Design

- Design mobile-first
- Grille adaptative pour les cartes statistiques
- Onglets compacts sur mobile
- Scroll areas pour les longues listes

### Animations

- Transitions fluides entre onglets
- Animations d'apparition des suggestions (stagger)
- Skeleton loaders pendant le chargement

## Performance

### Optimisations

1. **Chargement des données :**
   - Hook unique qui centralise toutes les requêtes
   - Chargement au montage du composant uniquement

2. **Affichage :**
   - Scroll areas pour éviter le rendu de listes trop longues
   - Skeleton loaders pour feedback immédiat

3. **Calculs :**
   - Relations calculées côté client à partir des contributions
   - Évite les requêtes multiples à la base de données

## Évolutions Futures

### Améliorations Possibles

1. **Graphiques et Visualisations**
   - Graphique d'évolution du score dans le temps
   - Graphique circulaire des occasions de contribution
   - Timeline visuelle des contributions

2. **Comparaison Communautaire**
   - Position dans le classement global
   - Comparaison avec la moyenne de la communauté
   - Badges de rang (Top 10%, Top 5%, etc.)

3. **Objectifs Personnalisés**
   - Définir des objectifs de score
   - Suivi de progression vers les objectifs
   - Notifications d'atteinte d'objectifs

4. **Export et Partage**
   - Export PDF du profil de réciprocité
   - Partage du badge sur les réseaux sociaux
   - Certificats de générosité

5. **Gamification Avancée**
   - Défis mensuels de réciprocité
   - Récompenses pour les streaks
   - Système de parrainage avec bonus

6. **Intelligence Artificielle**
   - Prédiction des meilleures occasions pour contribuer
   - Suggestions de montants optimaux
   - Détection des relations nécessitant attention

## Accessibilité

- Labels ARIA pour les icônes
- Contraste des couleurs conforme WCAG 2.1
- Navigation au clavier possible
- Textes alternatifs pour les badges

## Support

Pour toute question ou amélioration :
- Documentation complète dans ce guide
- Code commenté dans les composants
- Types TypeScript pour la sécurité
