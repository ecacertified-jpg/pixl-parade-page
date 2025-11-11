# Guide : Suggestions de Montants Intelligentes

## 📊 Vue d'ensemble

Le système de suggestions de montants intelligentes utilise l'intelligence artificielle et l'analyse de données pour proposer des montants de contribution personnalisés basés sur :
- L'historique de réciprocité entre utilisateurs
- Les contributions moyennes par occasion
- Le score de générosité personnel
- Les patterns de contribution

## 🎯 Fonctionnalités principales

### 1. Analyse de Réciprocité Directe
```typescript
// Vérifie l'historique d'échanges entre le contributeur et le créateur
const reciprocityData = await supabase
  .from('reciprocity_tracking')
  .select('contribution_amount')
  .or(`and(donor_id.eq.${fundCreatorId},beneficiary_id.eq.${user.id}),
       and(donor_id.eq.${user.id},beneficiary_id.eq.${fundCreatorId})`);
```

**Résultat :** Si vous avez déjà échangé des cadeaux avec cette personne, le système suggère un montant similaire à vos échanges précédents.

### 2. Moyenne Personnelle
```typescript
// Analyse les 10 dernières contributions de l'utilisateur
const userContributions = await supabase
  .from('fund_contributions')
  .select('amount')
  .eq('contributor_id', user.id)
  .order('created_at', { ascending: false })
  .limit(10);
```

**Résultat :** Propose votre montant de contribution habituel.

### 3. Montant par Occasion
```typescript
// Compare avec vos contributions pour des occasions similaires
const occasionContributions = await supabase
  .from('fund_contributions')
  .select('amount, fund_id, collective_funds!inner(occasion)')
  .eq('contributor_id', user.id);
```

**Résultat :** Suggère un montant basé sur ce que vous donnez habituellement pour :
- Anniversaires
- Mariages
- Réussites académiques
- Promotions professionnelles

### 4. Part Équitable
**Calcul :** `targetAmount / 5 contributeurs estimés`

**Résultat :** Montant si 5 personnes participent équitablement.

### 5. Score de Générosité
```typescript
const reciprocityScore = await supabase
  .from('reciprocity_scores')
  .select('generosity_score')
  .eq('user_id', user.id)
  .single();

// Calcul du montant selon le score
if (score >= 80) {
  generousAmount = targetAmount * 0.30; // 30% de l'objectif
} else if (score >= 60) {
  generousAmount = targetAmount * 0.20; // 20% de l'objectif
} else {
  generousAmount = targetAmount * 0.15; // 15% de l'objectif
}
```

**Résultat :** Plus votre score est élevé, plus le système vous propose un montant généreux adapté à votre profil.

### 6. Montants Standards
**Si aucun historique :** `[5 000, 10 000, 20 000, 50 000] XOF`

**Résultat :** Montants de base pour les nouveaux utilisateurs.

## 🎨 Interface Utilisateur

### Composant SmartAmountSuggestions

```tsx
<SmartAmountSuggestions
  suggestions={smartSuggestions.suggestions}
  loading={smartSuggestions.loading}
  hasHistory={smartSuggestions.hasHistory}
  reciprocityScore={smartSuggestions.reciprocityScore}
  onSelectAmount={(amount) => setAmount(amount.toString())}
  currentAmount={amount}
/>
```

### Affichage des Suggestions

Chaque suggestion affiche :
- **Montant** : En format `XXK XOF`
- **Label** : Type de suggestion (Réciprocité, Ma moyenne, etc.)
- **Raison** : Explication de la suggestion
- **Indicateurs visuels** :
  - ✨ Icône Sparkles pour la suggestion prioritaire
  - 🏆 Badge avec score de réciprocité
  - 📜 Badge "Basé sur votre historique"

### États Visuels

**Sélectionné :**
```css
bg-gradient-to-br from-primary to-primary/80 text-primary-foreground
```

**Non sélectionné :**
```css
hover:bg-accent hover:border-primary/50
```

## 🔄 Logique de Priorisation

1. **Réciprocité directe** (priorité la plus haute)
2. **Moyenne personnelle**
3. **Occasion similaire**
4. **Part équitable**
5. **Score de générosité**
6. **Montants standards** (si pas d'historique)

## 📊 Algorithme de Déduplication

```typescript
const uniqueSuggestions = Array.from(
  new Map(suggestions.map((s) => [s.amount, s])).values()
)
  .sort((a, b) => a.amount - b.amount)
  .filter((s) => s.amount >= 1000 && s.amount <= remainingAmount)
  .slice(0, 4);
```

**Règles :**
- Maximum 4 suggestions affichées
- Montant minimum : 1 000 XOF
- Montant maximum : Montant restant de la cagnotte
- Tri par ordre croissant
- Déduplication automatique

## 🎯 Exemples de Scénarios

### Scénario 1 : Utilisateur avec Historique Fort
**Contexte :**
- Score de réciprocité : 85
- Historique avec le créateur : 3 contributions (moyenne 15 000 XOF)
- Contributions personnelles moyennes : 12 000 XOF

**Suggestions :**
1. **15K XOF** - Réciprocité (basé sur historique avec ce contact)
2. **12K XOF** - Ma moyenne (votre contribution habituelle)
3. **30K XOF** - Contribution généreuse (score 85)
4. **20K XOF** - Part équitable

### Scénario 2 : Nouvel Utilisateur
**Contexte :**
- Pas d'historique
- Premier cadeau collectif
- Objectif : 100 000 XOF

**Suggestions :**
1. **5K XOF** - Montant suggéré
2. **10K XOF** - Montant suggéré
3. **20K XOF** - Part équitable
4. **50K XOF** - Montant suggéré

### Scénario 3 : Occasion Spécifique (Mariage)
**Contexte :**
- Occasion : Mariage
- Historique mariages : 3 contributions (moyenne 35 000 XOF)
- Score : 72

**Suggestions :**
1. **35K XOF** - Occasion similaire (moyenne pour mariages)
2. **25K XOF** - Ma moyenne générale
3. **40K XOF** - Contribution généreuse (score 72)
4. **30K XOF** - Part équitable

## 🔐 Sécurité et Performance

### Optimisations
- Cache des suggestions pendant la session
- Chargement asynchrone en arrière-plan
- Skeleton loading pendant le calcul
- Gestion des erreurs silencieuse (fallback sur montants standards)

### Respect de la Vie Privée
- Analyse uniquement des données de l'utilisateur connecté
- Pas de partage des montants entre utilisateurs
- RLS Policies appliquées sur toutes les requêtes

## 📈 Métriques de Succès

Le système peut être mesuré par :
- **Taux d'adoption** : % d'utilisateurs qui cliquent sur une suggestion
- **Taux de conversion** : % de contributions complétées avec suggestions
- **Montant moyen** : Comparaison avant/après implémentation
- **Satisfaction** : Feedback utilisateurs sur la pertinence

## 🔄 Évolutions Futures

1. **Machine Learning** : Prédiction basée sur l'IA
2. **Suggestions contextuelles** : En fonction du moment de l'année
3. **Peer comparison** : Comparer avec d'autres utilisateurs similaires
4. **Dynamic pricing** : Ajustement selon l'urgence de la cagnotte
5. **A/B Testing** : Optimisation des algorithmes de suggestion

## 🛠️ Maintenance

### Mise à jour de l'algorithme
Fichier : `src/hooks/useSmartAmountSuggestions.ts`

### Personnalisation des labels
Fichier : `src/components/SmartAmountSuggestions.tsx`

### Tests recommandés
```typescript
// Test avec historique riche
// Test sans historique
// Test avec montant restant faible
// Test avec différents scores de réciprocité
// Test pour chaque type d'occasion
```

## 📞 Support

Pour toute question ou amélioration, consultez :
- **Documentation technique** : `src/hooks/useSmartAmountSuggestions.ts`
- **Composant UI** : `src/components/SmartAmountSuggestions.tsx`
- **Guide réciprocité** : `LOYALTY_BADGES_GUIDE.md`
- **Guide contributions** : `CONTRIBUTION_BADGES_GUIDE.md`

---

**Version :** 1.0.0  
**Dernière mise à jour :** 2025-01-11  
**Statut :** ✅ Production Ready
