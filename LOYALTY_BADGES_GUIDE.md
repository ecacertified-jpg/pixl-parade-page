# Système de Badges de Fidélité Anniversaire

## Vue d'ensemble

Le système de badges de fidélité récompense les utilisateurs qui célèbrent plusieurs anniversaires sur la plateforme JOIE DE VIVRE. Chaque anniversaire célébré augmente le niveau de badge de l'utilisateur.

## Niveaux de badges

| Niveau | Badge | Anniversaires requis | Description |
|--------|-------|---------------------|-------------|
| 0 | 🎂 Nouveau | 0 | Pas encore d'anniversaire célébré |
| 1 | 🥉 Bronze | 1 | Premier anniversaire sur la plateforme |
| 2 | 🥈 Argent | 2 | Deuxième anniversaire |
| 3 | 🏆 Or | 3 | Troisième anniversaire |
| 4 | ⭐ Platine | 5 | Cinquième anniversaire |
| 5 | 💎 Diamant | 10+ | Dix anniversaires ou plus |

## Fonctionnalités

### 1. Enregistrement automatique des anniversaires

Lorsqu'un utilisateur célèbre son anniversaire :
- L'historique est enregistré dans la table `birthday_celebrations`
- Le profil utilisateur est mis à jour avec le nouveau badge
- Une notification spéciale affiche le badge de fidélité

### 2. Badges dans les notifications

Les notifications d'anniversaire affichent :
- Le badge de fidélité actuel avec animation
- Le nombre total d'anniversaires célébrés
- Un message spécial si un nouveau badge est débloqué
- L'année du premier anniversaire sur la plateforme

### 3. Carte de statistiques de badges

Un composant `BirthdayStatsCard` affiche :
- Le badge actuel avec son nom et niveau
- Le nombre d'anniversaires célébrés
- Le nombre d'années en tant que membre
- La progression vers le prochain badge
- Les années d'anniversaires célébrés

## Tables de base de données

### `birthday_celebrations`

Stocke l'historique de tous les anniversaires célébrés.

```sql
- id: UUID (PK)
- user_id: UUID (FK vers auth.users)
- celebration_year: INTEGER (année de célébration)
- celebrated_at: TIMESTAMP (date de célébration)
- age_at_celebration: INTEGER (âge lors de la célébration)
- milestone_age: BOOLEAN (âge marquant: 18, 30, 50, etc.)
- created_at: TIMESTAMP
```

### Colonnes ajoutées à `profiles`

```sql
- birthday_badge_level: INTEGER (0-5)
- total_birthdays_celebrated: INTEGER
- first_birthday_on_platform: DATE
- badges: JSONB (pour futurs badges additionnels)
```

### Vue `user_birthday_stats`

Vue SQL qui agrège les statistiques de badges par utilisateur :
- Nom du badge actuel
- Niveau du badge
- Nombre total d'anniversaires célébrés
- Liste des années célébrées
- Date du premier anniversaire

## Utilisation dans le code

### Hook `useBirthdayStats`

```typescript
import { useBirthdayStats } from '@/hooks/useBirthdayStats';

function MyComponent() {
  const { stats, loading, error } = useBirthdayStats();
  
  if (stats) {
    console.log(`Badge: ${stats.badgeName}`);
    console.log(`Anniversaires: ${stats.totalCelebrations}`);
  }
}
```

### Composant `BirthdayLoyaltyBadge`

```typescript
import { BirthdayLoyaltyBadge } from '@/components/BirthdayLoyaltyBadge';

<BirthdayLoyaltyBadge
  level={3} // 0-5
  name="🏆 Or"
  totalCelebrations={3}
  earnedNewBadge={true}
  size="lg" // 'sm' | 'md' | 'lg'
  showLabel={true}
/>
```

### Composant `BirthdayStatsCard`

```typescript
import { BirthdayStatsCard } from '@/components/BirthdayStatsCard';

// Affiche automatiquement les statistiques de l'utilisateur connecté
<BirthdayStatsCard />
```

## Logique d'attribution des badges

La fonction edge `birthday-wishes` :

1. Vérifie si c'est l'anniversaire de l'utilisateur
2. Enregistre la célébration dans `birthday_celebrations`
3. Compte le nombre total d'anniversaires célébrés
4. Calcule le niveau de badge approprié
5. Met à jour le profil avec le nouveau badge
6. Crée une notification incluant les informations du badge

## Messages spéciaux

Lorsqu'un utilisateur gagne un nouveau badge :
- La notification affiche "✨ Nouveau badge débloqué !"
- Le badge apparaît avec une animation festive
- Le badge pulse pour attirer l'attention

## Bénéfices du système

1. **Engagement** : Encourage les utilisateurs à revenir chaque année
2. **Fidélisation** : Récompense la loyauté à long terme
3. **Gamification** : Crée une progression motivante
4. **Communauté** : Valorise les membres anciens
5. **Célébration** : Rend chaque anniversaire encore plus spécial

## Évolutions futures possibles

- Badges spéciaux pour les âges marquants (18, 30, 50 ans)
- Badges de contribution (offrir des cadeaux, créer des cagnottes)
- Badges saisonniers (anniversaires pendant les fêtes)
- Récompenses exclusives pour les hauts niveaux
- Classement communautaire des badges
- Export de badge en image pour partage sur réseaux sociaux
