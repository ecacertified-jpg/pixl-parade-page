

# Plan : Ajouter l'étape "Crée ta page d'anniversaire" dans l'onboarding (conditionnelle)

## Principe

Une nouvelle étape 5 s'ajoute à l'onboarding **uniquement si l'anniversaire de l'utilisateur est dans 45 jours ou moins**. Cette étape demande de créer sa page d'anniversaire. Elle bloque l'accès au dashboard tant qu'elle n'est pas accomplie, puis redirige automatiquement.

## Conditions d'affichage

```text
Si daysUntilBirthday <= 45 → TOTAL_STEPS = 6 (étapes 0-5)
Sinon                      → TOTAL_STEPS = 5 (étapes 0-4, comme actuellement)
```

## Comportement de la nouvelle étape (step 5)

1. Icône festive (Cake/PartyPopper) avec gradient
2. Message incitatif : "Ton anniversaire approche dans X jours ! Crée ta page d'anniversaire pour recevoir des cadeaux et des messages de tes proches 🎂"
3. Bouton CTA "Créer ma page d'anniversaire" qui :
   - Crée la `birthday_page` en base (même logique que `fetchOrCreateBirthdayPage` du Dashboard)
   - Stocke le slug dans un state local
4. Une fois la page créée → affiche un état de succès avec confettis + lien de la page
5. Condition de complétion : `hasBirthdayPage === true`
6. Auto-redirection vers le dashboard après 2.5s (comme l'étape Amis)

## Modifications dans `src/components/OnboardingExperience.tsx`

### 1. Rendre `TOTAL_STEPS` dynamique

```typescript
const shouldShowBirthdayPageStep = daysUntilBirthday !== null && daysUntilBirthday <= 45;
const DYNAMIC_TOTAL_STEPS = shouldShowBirthdayPageStep ? 6 : 5;
```

Remplacer toutes les references a `TOTAL_STEPS` par `DYNAMIC_TOTAL_STEPS`.

### 2. Nouveaux states

```typescript
const [hasBirthdayPage, setHasBirthdayPage] = useState(false);
const [birthdayPageSlug, setBirthdayPageSlug] = useState<string | null>(null);
const [creatingBirthdayPage, setCreatingBirthdayPage] = useState(false);
```

### 3. Vérifier au chargement si la page existe déjà

Au mount, vérifier si une `birthday_page` existe pour l'année en cours → si oui, `setHasBirthdayPage(true)`.

### 4. Fonction `handleCreateBirthdayPage`

Reprend la logique du Dashboard : crée la page en base, stocke le slug, déclenche confettis.

### 5. Ajouter le rendu de l'étape 5

- Bandeau incitatif si `!hasBirthdayPage`
- Bouton CTA animé
- État de succès avec auto-redirection

### 6. Mettre à jour `isStepCompleted`

```typescript
case 5: return hasBirthdayPage;
```

### 7. Mettre à jour les labels de navigation

```typescript
const stepLabels = shouldShowBirthdayPageStep
  ? ['Accueil', 'Anniversaire', 'Goûts', 'Souhaits', 'Amis', 'Ma page']
  : ['Accueil', 'Anniversaire', 'Goûts', 'Souhaits', 'Amis'];
```

### 8. Auto-redirection sur step 5

Meme pattern que step 4 : quand `hasBirthdayPage` passe a `true`, confettis + `onComplete()` apres 2.5s.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter étape conditionnelle "Crée ta page d'anniversaire" |

