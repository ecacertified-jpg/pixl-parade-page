# Guide des Badges de Contribution

## Vue d'ensemble

Le système de badges de contribution récompense les utilisateurs pour leur engagement et leurs actions sur la plateforme JOIE DE VIVRE. Au-delà des badges d'anniversaire, les utilisateurs peuvent gagner des badges pour leurs contributions, leurs créations de cagnottes, leurs interactions sociales et leurs accomplissements.

## Catégories de badges

### 1. 💝 Badges de Contribution (Generous Donor)

Récompensent le nombre de cagnottes auxquelles l'utilisateur a contribué.

| Niveau | Badge | Nom | Seuil | Description |
|--------|-------|-----|-------|-------------|
| 1 | 💝 | Donateur Généreux | 5 | A contribué à 5 cagnottes |
| 2 | 💖 | Donateur Exceptionnel | 10 | A contribué à 10 cagnottes |
| 3 | 💎 | Philanthrope | 25 | A contribué à 25 cagnottes |
| 4 | 👑 | Mécène | 50 | A contribué à 50 cagnottes |
| 5 | 🌟 | Légende de la Générosité | 100 | A contribué à 100 cagnottes |

### 2. 💰 Badges de Montant (Big Spender)

Récompensent le montant total donné sur la plateforme.

| Niveau | Badge | Nom | Seuil | Description |
|--------|-------|-----|-------|-------------|
| 1 | 💰 | Généreux | 50 000 FCFA | A donné 50 000 FCFA au total |
| 2 | 💵 | Très Généreux | 100 000 FCFA | A donné 100 000 FCFA au total |
| 3 | 💸 | Grand Donateur | 250 000 FCFA | A donné 250 000 FCFA au total |
| 4 | 🏆 | Bienfaiteur | 500 000 FCFA | A donné 500 000 FCFA au total |
| 5 | 👑 | Philanthrope Majeur | 1 000 000 FCFA | A donné 1 000 000 FCFA au total |

### 3. 🎯 Badges de Création (Fund Creator)

Récompensent la création de cagnottes collaboratives.

| Niveau | Badge | Nom | Seuil | Description |
|--------|-------|-----|-------|-------------|
| 1 | 🎯 | Créateur | 3 | A créé 3 cagnottes |
| 2 | 🎪 | Organisateur | 10 | A créé 10 cagnottes |
| 3 | 🎭 | Maître Organisateur | 25 | A créé 25 cagnottes |
| 4 | 🌟 | Expert en Collectes | 50 | A créé 50 cagnottes |
| 5 | 👑 | Légende des Cagnottes | 100 | A créé 100 cagnottes |

### 4. 🏆 Badges d'Accomplissement (Successful Funds)

Récompensent les cagnottes qui ont atteint leur objectif.

| Niveau | Badge | Nom | Seuil | Description |
|--------|-------|-----|-------|-------------|
| 1 | 🎯 | Objectif Atteint | 3 | 3 cagnottes ont atteint leur objectif |
| 2 | 🏅 | Succès Multiple | 10 | 10 cagnottes ont atteint leur objectif |
| 3 | 🏆 | Expert du Succès | 25 | 25 cagnottes ont atteint leur objectif |
| 4 | 👑 | Champion des Collectes | 50 | 50 cagnottes ont atteint leur objectif |
| 5 | 💎 | Maître des Objectifs | 100 | 100 cagnottes ont atteint leur objectif |

### 5. 👥 Badges Communautaires (Social)

Récompensent la construction du réseau d'amis.

| Niveau | Badge | Nom | Seuil | Description |
|--------|-------|-----|-------|-------------|
| 1 | 🦋 | Papillon Social | 10 | A ajouté 10 amis |
| 2 | 🌐 | Bâtisseur de Réseau | 25 | A ajouté 25 amis |
| 3 | 👥 | Leader Communautaire | 50 | A ajouté 50 amis |
| 4 | 🌟 | Super Connecteur | 100 | A ajouté 100 amis |
| 5 | 👑 | Légende du Réseau | 250 | A ajouté 250 amis |

### 6. ✨ Badges Spéciaux

Badges uniques pour des actions spécifiques.

| Badge | Nom | Seuil | Description |
|-------|-----|-------|-------------|
| 🚀 | Pionnier | Spécial | Parmi les premiers utilisateurs |
| 🙏 | Maître de la Gratitude | 25 | A envoyé 25 messages de remerciement |
| 🎉 | Organisateur de Fêtes | 10 | A organisé 10 événements surprise |

## Fonctionnement

### Attribution automatique

Les badges sont attribués automatiquement via :

1. **Triggers de base de données** : Déclenchés après les actions clés (contribution, création de cagnotte, ajout d'ami)
2. **Edge Function `award-badges`** : Vérifie tous les critères et attribue les badges appropriés
3. **Notification instantanée** : L'utilisateur reçoit une notification festive avec confettis

### Vérification manuelle

Vous pouvez aussi vérifier et attribuer manuellement les badges via :

```typescript
import { triggerBadgeCheckAfterAction } from '@/utils/badgeAwarder';

// Après une action
await triggerBadgeCheckAfterAction('contribution', userId);
```

## Composants

### `ContributionBadge`

Affiche un badge individuel avec :
- Animation d'apparition
- Gradient personnalisé selon le badge
- Niveau du badge
- Action pour afficher/masquer sur le profil

```typescript
<ContributionBadge
  badge={badge}
  size="md"
  showActions={true}
  onToggleShowcase={toggleShowcase}
/>
```

### `AllBadgesCollection`

Affiche tous les badges de l'utilisateur avec filtres par catégorie.

```typescript
<AllBadgesCollection />
```

### `BadgeProgressCard`

Affiche la progression vers les prochains badges dans toutes les catégories.

```typescript
<BadgeProgressCard />
```

### `BadgeEarnedNotificationCard`

Notification spéciale avec confettis quand un badge est gagné.

## Base de données

### Tables

- `badge_definitions` : Catalogue de tous les badges disponibles
- `user_badges` : Badges obtenus par chaque utilisateur
- `birthday_celebrations` : Historique des anniversaires (pour badges de fidélité)

### Vues

- `user_badges_with_definitions` : Badges des utilisateurs avec leurs définitions complètes
- `user_birthday_stats` : Statistiques d'anniversaire par utilisateur

### Fonctions

- `trigger_badge_check()` : Fonction trigger qui lance la vérification des badges
- `get_user_badge_progress()` : Obtient la progression de l'utilisateur dans toutes les catégories

## Edge Function `award-badges`

### Endpoint

```
POST /functions/v1/award-badges
Body: { "userId": "uuid" }
```

### Logique

1. Récupère toutes les définitions de badges
2. Pour chaque badge, vérifie si l'utilisateur remplit les critères
3. Attribue les badges manquants
4. Crée une notification pour chaque nouveau badge
5. Retourne la liste des badges nouvellement attribués

### Exemple d'appel

```typescript
const { data } = await supabase.functions.invoke('award-badges', {
  body: { userId: user.id }
});
```

## Fonctionnalités

### 1. Progression visible

Les utilisateurs voient leur progression vers les prochains badges dans la carte `BadgeProgressCard`.

### 2. Collection complète

L'onglet "Badges" dans le Dashboard affiche tous les badges gagnés avec filtres par catégorie.

### 3. Badges mis en avant

Les utilisateurs peuvent choisir jusqu'à 3 badges à afficher sur leur profil public.

### 4. Notifications festives

Chaque nouveau badge déclenche :
- Une notification avec confettis
- Un message de félicitations
- Un bouton pour voir la collection

## Intégration dans l'application

### Après une contribution

```typescript
// Dans ContributionModal.tsx
await triggerBadgeCheckAfterAction('contribution', user.id);
```

### Après création de cagnotte

```typescript
// Automatique via trigger de base de données
// Ou manuellement :
await triggerBadgeCheckAfterAction('fund_creation', user.id);
```

### Après ajout d'ami

```typescript
// Dans Dashboard.tsx
await triggerBadgeCheckAfterAction('add_friend', user.id);
```

### Après envoi de remerciements

```typescript
// Dans ThanksModal.tsx
await triggerBadgeCheckAfterAction('send_thanks', user.id);
```

## Évolutions futures

- 🎨 Badges saisonniers (Noël, Nouvel An, etc.)
- 🌟 Badges exclusifs pour événements spéciaux
- 🏅 Classement des meilleurs collectionneurs
- 📱 Partage de badges sur réseaux sociaux
- 🎁 Récompenses exclusives pour certains badges
- 💎 Badges combinés (ex: "Philanthrope Diamant" = Diamant anniversaire + Diamant contribution)
