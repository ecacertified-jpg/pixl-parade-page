# Guide du Système de Badges de Réciprocité

## Vue d'ensemble

Le système de badges de réciprocité récompense visuellement les utilisateurs pour leur participation active dans la communauté JOIE DE VIVRE. Les badges évoluent selon le score de réciprocité de l'utilisateur, offrant des avantages progressifs et créant une motivation pour maintenir un bon équilibre entre donner et recevoir.

## Les 4 Niveaux de Badges

### 1. Nouveau (Newcomer) 🩶
**Score requis:** 0-19 points

**Apparence:**
- Icône: Cœur
- Couleur: Gris
- Animation: Aucune

**Description:** "Bienvenue dans la communauté !"

**Avantages:**
- Accès à toutes les fonctionnalités de base
- Participation aux cagnottes publiques

---

### 2. Contributeur (Helper) 💙
**Score requis:** 20-49 points

**Apparence:**
- Icône: Trophée
- Couleur: Bleu
- Animation: Pulsation douce (scale 1.05x)

**Description:** "Vous contribuez régulièrement"

**Avantages:**
- Badge visible sur votre profil
- Priorité dans les suggestions de montants
- Accès aux statistiques détaillées

---

### 3. Généreux (Generous) 💜
**Score requis:** 50-79 points

**Apparence:**
- Icône: Tendance croissante
- Couleur: Violet
- Animation: Pulsation + légère rotation (±5°)

**Description:** "Votre générosité inspire la communauté"

**Avantages:**
- Badge animé sur votre profil
- Suggestions de montants optimisées
- Visibilité accrue dans les leaderboards
- Notifications prioritaires

---

### 4. Champion 👑
**Score requis:** 80+ points

**Apparence:**
- Icône: Couronne
- Couleur: Or/Jaune
- Animation: Pulsation + rotation (±10°) + mouvement vertical + étoiles tournantes

**Description:** "Pilier de la communauté JOIE DE VIVRE"

**Avantages:**
- Badge prestigieux avec animation premium
- Rang de Champion dans les classements
- Influence sur les suggestions communautaires
- Accès anticipé aux nouvelles fonctionnalités
- Reconnaissance spéciale de la plateforme

---

## Composants Disponibles

### 1. ReciprocityBadge
Composant principal pour afficher un badge de réciprocité.

**Props:**
```typescript
{
  score: number;          // Score de réciprocité (0-100+)
  size?: 'sm' | 'md' | 'lg' | 'xl';  // Taille du badge
  showLabel?: boolean;    // Afficher le nom du niveau
  showScore?: boolean;    // Afficher le score numérique
  animated?: boolean;     // Activer les animations
  className?: string;     // Classes CSS supplémentaires
}
```

**Utilisation:**
```tsx
<ReciprocityBadge 
  score={75} 
  size="lg" 
  showLabel 
  showScore 
  animated 
/>
```

---

### 2. ReciprocityBadgeWithTooltip
Badge avec tooltip au survol affichant les détails et avantages.

**Props:**
```typescript
{
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

**Utilisation:**
```tsx
<ReciprocityBadgeWithTooltip score={userScore} size="md" />
```

---

### 3. BadgeProgressCard
Carte affichant la progression vers le prochain badge.

**Props:**
```typescript
{
  currentScore: number;  // Score actuel de l'utilisateur
}
```

**Affiche:**
- Badge actuel en grand format
- Description et avantages débloqués
- Barre de progression vers le prochain niveau
- Aperçu des avantages à venir
- Vue d'ensemble de tous les badges

**Utilisation:**
```tsx
<BadgeProgressCard currentScore={userScore} />
```

---

### 4. AllBadgesCollection
Collection complète de tous les badges avec détails.

**Props:**
```typescript
{
  currentScore: number;  // Score actuel de l'utilisateur
}
```

**Affiche:**
- Tous les badges (débloqués et verrouillés)
- Statut de déverrouillage
- Indicateur du badge actuel
- Avantages de chaque niveau
- Points manquants pour débloquer

**Utilisation:**
```tsx
<AllBadgesCollection currentScore={userScore} />
```

---

### 5. BadgeEarnedNotificationCard
Notification de célébration lors du déblocage d'un nouveau badge.

**Props:**
```typescript
{
  newScore: number;      // Nouveau score
  oldScore: number;      // Ancien score
  onDismiss: () => void; // Fermer la notification
  onShare?: () => void;  // Partager sur les réseaux (optionnel)
}
```

**Fonctionnalités:**
- Détection automatique du changement de niveau
- Animation confetti automatique
- Affichage du nouveau badge
- Liste des nouveaux avantages débloqués
- Options de partage

**Utilisation:**
```tsx
<BadgeEarnedNotificationCard 
  newScore={55}
  oldScore={45}
  onDismiss={() => setShowNotif(false)}
  onShare={() => shareOnSocial()}
/>
```

---

## Intégration dans l'Application

### Dashboard Principal

Le badge s'affiche automatiquement dans le dashboard avec le score actuel:

```tsx
{reciprocityScore && (
  <ReciprocityBadge
    score={reciprocityScore.generosity_score}
    showLabel
    showScore
    size="md"
  />
)}
```

### Profil Utilisateur

Affichez le badge avec tooltip sur le profil:

```tsx
<ReciprocityBadgeWithTooltip 
  score={userScore} 
  size="lg" 
/>
```

### Page Dédiée aux Badges

Une page complète pour explorer tous les badges:

```tsx
<div className="space-y-6">
  <BadgeProgressCard currentScore={userScore} />
  <AllBadgesCollection currentScore={userScore} />
</div>
```

### Notifications de Déblocage

Surveiller les changements de score et afficher la notification:

```tsx
const [prevScore, setPrevScore] = useState(userScore);

useEffect(() => {
  if (userScore > prevScore) {
    const oldBadge = getBadgeByScore(prevScore);
    const newBadge = getBadgeByScore(userScore);
    
    if (oldBadge.level !== newBadge.level) {
      setShowBadgeNotification(true);
    }
  }
  setPrevScore(userScore);
}, [userScore]);

{showBadgeNotification && (
  <BadgeEarnedNotificationCard
    newScore={userScore}
    oldScore={prevScore}
    onDismiss={() => setShowBadgeNotification(false)}
  />
)}
```

---

## Fonctions Utilitaires

### getBadgeByScore(score: number)
Retourne la configuration du badge correspondant au score.

```typescript
const badgeConfig = getBadgeByScore(75);
// Returns: BADGE_CONFIGS.generous
```

### BADGE_CONFIGS
Objet contenant toutes les configurations de badges.

```typescript
const allBadges = Object.values(BADGE_CONFIGS);
// Returns: [newcomer, helper, generous, champion]
```

---

## Animations

### Types d'Animations par Niveau

**Nouveau:** Aucune animation (statique)

**Contributeur:**
- Pulsation: scale 1 → 1.05 → 1
- Durée: 2 secondes
- Répétition: Infinie

**Généreux:**
- Pulsation: scale 1 → 1.1 → 1
- Rotation: 0° → 5° → -5° → 0°
- Durée: 3 secondes
- Répétition: Infinie

**Champion:**
- Pulsation: scale 1 → 1.15 → 1
- Rotation: 0° → 10° → -10° → 0°
- Mouvement vertical: 0px → -5px → 0px
- Étoiles tournantes: Rotation continue 360°
- Effet de lueur pulsante
- Durée: 4 secondes
- Répétition: Infinie

### Désactiver les Animations

Pour les performances ou l'accessibilité:

```tsx
<ReciprocityBadge 
  score={score} 
  animated={false} 
/>
```

---

## Calcul du Score de Réciprocité

Le score est calculé dans `reciprocity_scores` basé sur:

- **Contributions données** (nombre et montant)
- **Fonds créés** (initiative)
- **Équilibre donner/recevoir**
- **Régularité des contributions**

**Formule simplifiée:**
```
score = (contributions_count × 10) + (fonds_created × 20) + (total_given / 10000)
Limité à un maximum de 100
```

---

## Style et Personnalisation

### Couleurs des Badges

Les couleurs sont définies via des gradients Tailwind:

- **Nouveau:** `from-gray-400 to-gray-600`
- **Contributeur:** `from-blue-400 to-blue-600`
- **Généreux:** `from-purple-400 to-purple-600`
- **Champion:** `from-yellow-400 via-amber-500 to-yellow-600`

### Tailles Disponibles

| Size | Dimension | Icon Size | Utilisation Recommandée |
|------|-----------|-----------|------------------------|
| sm | 32px (w-8 h-8) | 16px (w-4 h-4) | Listes, aperçus compacts |
| md | 48px (w-12 h-12) | 24px (w-6 h-6) | Profils, cartes |
| lg | 64px (w-16 h-16) | 32px (w-8 h-8) | Pages détaillées |
| xl | 96px (w-24 h-24) | 48px (w-12 h-12) | Célébrations, achievements |

---

## Gamification et Engagement

### Stratégies pour Encourager la Progression

1. **Notifications Proactives:**
   - "Plus que 5 points pour devenir Contributeur !"
   - "Vous êtes à 80% vers le badge Généreux"

2. **Récompenses Visuelles:**
   - Confetti lors du déblocage
   - Badge animé une fois obtenu
   - Partage social automatique

3. **Avantages Concrets:**
   - Suggestions de montants améliorées
   - Priorité dans les notifications
   - Visibilité accrue

4. **Affichage Public:**
   - Badge visible sur le profil
   - Classements communautaires
   - Reconnaissance dans les leaderboards

---

## Accessibilité

### Considérations Importantes

1. **Animations Réduites:**
   Respecter `prefers-reduced-motion`:
   ```tsx
   const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   <ReciprocityBadge animated={!prefersReducedMotion} />
   ```

2. **Contraste des Couleurs:**
   Tous les badges respectent un ratio de contraste minimum de 4.5:1

3. **Descriptions Alternatives:**
   Ajouter des attributs aria-label:
   ```tsx
   <div aria-label={`Badge ${badge.name} - Score: ${score}`}>
     <ReciprocityBadge score={score} />
   </div>
   ```

4. **Navigation Clavier:**
   Tous les éléments interactifs sont accessibles au clavier

---

## Performance

### Optimisations

1. **Animations Conditionnelles:**
   - Désactiver les animations pour les badges hors écran
   - Utiliser `will-change` avec parcimonie

2. **Lazy Loading:**
   ```tsx
   const AllBadgesCollection = lazy(() => import('./AllBadgesCollection'));
   ```

3. **Mémoisation:**
   ```tsx
   const badge = useMemo(() => getBadgeByScore(score), [score]);
   ```

---

## Évolutions Futures

### Améliorations Prévues

1. **Badges Spéciaux:**
   - Badges saisonniers (Noël, Anniversaire JOIE DE VIVRE)
   - Badges d'événements spéciaux
   - Badges de milestones (100ème contribution)

2. **Système de Niveaux:**
   - Sous-niveaux dans chaque catégorie
   - Étoiles pour indiquer la progression

3. **Collection Visuelle:**
   - Page dédiée pour voir tous les badges débloqués
   - Historique des déblocages avec dates
   - Statistiques de progression

4. **Partage Social:**
   - Génération automatique d'images pour le partage
   - Templates personnalisés par badge
   - Intégration réseaux sociaux

5. **Badges Collaboratifs:**
   - Badges de groupe (équipe)
   - Défis communautaires
   - Objectifs collectifs

---

## Support et Maintenance

### Debugging

Pour vérifier le badge d'un utilisateur:

```tsx
console.log('User Score:', userScore);
console.log('Current Badge:', getBadgeByScore(userScore));
```

### Tests

Tester tous les niveaux de badges:

```tsx
[0, 20, 50, 80, 100].forEach(score => {
  const badge = getBadgeByScore(score);
  console.log(`Score ${score} → Badge: ${badge.name}`);
});
```

### Problèmes Courants

1. **Badge ne s'anime pas:**
   - Vérifier que `animated={true}`
   - Vérifier que framer-motion est installé
   - Vérifier les préférences de mouvement réduit

2. **Score incorrect:**
   - Vérifier la source des données (reciprocity_scores)
   - Recalculer le score si nécessaire

3. **Confetti ne s'affiche pas:**
   - Vérifier que canvas-confetti est installé
   - Vérifier que le composant est bien monté

---

## Conclusion

Le système de badges de réciprocité est un élément clé de la gamification de JOIE DE VIVRE. Il encourage l'engagement, récompense la générosité et crée un sentiment de progression et d'accomplissement au sein de la communauté.

Pour toute question ou suggestion d'amélioration, n'hésitez pas à consulter la documentation technique ou à contacter l'équipe de développement.
