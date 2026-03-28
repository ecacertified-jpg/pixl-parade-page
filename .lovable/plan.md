

# Plan : Ajouter une étape "Liste de souhaits" à l'onboarding

## Constat

L'onboarding actuel (5 étapes) ne permet pas à l'utilisateur d'ajouter des articles à sa liste de souhaits. L'étape 2 ("Goûts") ne sauvegarde que des catégories de préférences, pas des produits concrets.

## Solution

Ajouter une **étape 3** (nouvelle) entre "Goûts" et "Amis" (qui devient étape 4), portant le total à **6 étapes**. Cette étape affiche une sélection de produits populaires filtrés par les catégories choisies à l'étape 2, et permet à l'utilisateur d'en ajouter à ses favoris (`user_favorites`) en un tap.

### Modifications dans `OnboardingExperience.tsx`

1. **`TOTAL_STEPS` passe de 5 à 6**
2. **Nouvelle étape (index 3) : "Ma liste de souhaits"**
   - Titre : "🎁 Qu'est-ce qui te ferait plaisir ?"
   - Description : "Choisis des idées cadeaux pour que tes proches sachent quoi t'offrir !"
   - Affiche une grille de produits populaires (requête `products` filtré par catégories sélectionnées à l'étape 2, `is_active = true`, limit 12)
   - Chaque carte produit a un bouton cœur pour ajouter/retirer des favoris (`user_favorites`)
   - Bouton "Voir tout le catalogue" qui redirige vers `/wishlist-catalog` et termine l'onboarding
   - Compteur : "X articles ajoutés à ta liste ❤️"
3. **Décaler les étapes existantes** : Amis → index 4, Page anniversaire → index 5
4. **Labels de navigation** : Ajouter "Souhaits" dans la barre de progression

### Logique de données

- Charger les produits via `supabase.from('products').select(...).eq('is_active', true).limit(12)`
- Si des catégories ont été sélectionnées à l'étape 2, filtrer par `category_id` correspondant (mapping catégorie onboarding → catégorie produit)
- Insérer/supprimer dans `user_favorites` au tap sur le cœur
- State local : `selectedProducts: string[]` pour le suivi visuel

### Labels de navigation mis à jour

```
Étape 0: Accueil
Étape 1: Anniversaire
Étape 2: Goûts
Étape 3: Souhaits    ← NOUVEAU
Étape 4: Amis
Étape 5: Ma page
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter étape 3, décaler indices, TOTAL_STEPS=6 |

