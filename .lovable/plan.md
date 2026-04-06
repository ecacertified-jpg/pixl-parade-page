

# Plan : Complétion de l'onboarding à l'étape 6 (cagnotte + partage)

## Résumé

Supprimer l'auto-complétion de l'onboarding à l'étape 5 (Amis). L'étape 5 passe toujours à l'étape 6 (Ma page). L'étape 6 devient obligatoire et permanente (suppression de la condition des 45 jours). L'onboarding se termine quand l'utilisateur a : (1) créé sa page d'anniversaire, (2) créé une cagnotte, et (3) partagé sa page avec ≥3 amis.

## Modifications

### 1. `src/components/OnboardingExperience.tsx`

**a) Supprimer la condition des 45 jours :**
- Ligne 95 : supprimer `shouldShowBirthdayPageStep`, fixer `DYNAMIC_TOTAL_STEPS = 6`
- Ligne 98-100 : `stepLabels` toujours 6 étapes
- Supprimer toutes les branches conditionnelles sur `shouldShowBirthdayPageStep`

**b) Step 4 (Amis) — toujours passer à l'étape 5 :**
- Lignes 183-201 : quand `invitationsSentCount >= 3`, toujours faire `onSetStep(5)` après confettis (supprimer la branche `else` qui appelle `onComplete`)

**c) Ajouter des états pour l'étape 6 enrichie :**
- `hasFund` (boolean) : l'utilisateur a créé une cagnotte d'anniversaire
- `shareCount` (number) : nombre de partages effectués (≥3 requis)
- `fundId` (string | null) : ID de la cagnotte créée

**d) Étape 6 — nouveau contenu :**
Remplacer le contenu actuel de l'étape 5 (birthday page) par un flow en 3 sous-étapes visuelles :
1. **Créer la page** (existant) → une fois créée, afficher ✅
2. **Créer une cagnotte** → bouton qui crée une cagnotte d'anniversaire liée à la page → une fois créée, afficher ✅
3. **Partager avec ≥3 amis** → boutons de partage WhatsApp/SMS/copie. Chaque clic de partage incrémente `shareCount` (stocké en localStorage pour persistance simple). Quand ≥3 → ✅

Quand les 3 sous-étapes sont complètes → confettis + auto-redirect vers dashboard après 2,5s

**e) `isStepCompleted` (ligne 445-454) :**
```typescript
case 5: return hasBirthdayPage && hasFund && shareCount >= 3;
```

**f) `stepHintMessage` :**
```typescript
case 5: return "Crée ta page, ta cagnotte et partage avec tes amis 🎂";
```

### 2. `src/hooks/useOnboarding.ts`

**Ajouter la vérification de l'étape 5 (page + cagnotte + partages) :**
- Ajouter `birthday_pages` et `collective_funds` (occasion = 'birthday') aux requêtes parallèles
- Après la vérification des amis (step 4), vérifier :
  - Existence d'une `birthday_page` active → sinon `firstIncompleteStep: 5`
  - Existence d'une `collective_fund` avec `occasion = 'birthday'` et `creator_id = userId` → sinon `firstIncompleteStep: 5`
  - Vérification du partage via localStorage (`onboarding_shares_${userId}` ≥ 3) → sinon `firstIncompleteStep: 5`

### 3. Logique de création de cagnotte dans l'étape 6

Fonction `handleCreateFund` :
- Insère dans `collective_funds` : `creator_id`, `title`, `occasion: 'birthday'`, `status: 'active'`, `currency: 'XOF'`
- Lie la cagnotte à la page via `birthday_pages.fund_id`
- Met à jour l'état `hasFund = true`

### 4. Persistance des partages

- À chaque clic sur un bouton de partage (WhatsApp, SMS, Copier le lien), incrémenter un compteur dans localStorage : `onboarding_shares_${userId}`
- Charger ce compteur au mount de l'étape 6

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Étape 6 permanente, sous-étapes cagnotte + partage, supprimer condition 45j |
| `src/hooks/useOnboarding.ts` | Vérifier page + cagnotte + partages pour l'étape 5 |

