

# Plan : Adapter l'onboarding pour le choix "Un autre événement"

## Constat

Actuellement, quand l'utilisateur sélectionne "Un autre événement" dans le quiz pré-inscription, la valeur `other_event` est sauvegardée mais l'onboarding la traite comme `my_birthday` (le cas par défaut). L'étape 5 affiche toujours "Finalise ta page d'anniversaire" au lieu de proposer la création d'une page pour un mariage, baptême, etc.

## Ce qui va changer

1. **Ajout d'un 3e cas** : `isOtherEvent = discoveryPurpose === 'other_event'`
2. **Étape 5 adaptée** pour `other_event` :
   - Titre : "Crée une page pour ton événement 🎊"
   - Description : "Mariage, baptême, fiançailles, diplôme... Célèbre chaque moment !"
   - Sélecteur d'occasion (choix parmi : Mariage, Baptême, Fiançailles, Réussite académique, Promotion, Autre)
   - Bouton page : "Créer la page de l'événement" → navigue vers le flow de création avec l'occasion sélectionnée
   - Bouton cagnotte : "Lancer une cagnotte pour l'événement"
3. **Label de l'étape 6** dans la barre de progression : "Événement" au lieu de "Ma page"

## Détails techniques

### Fichier : `src/components/OnboardingExperience.tsx`

**1. Variables dérivées (ligne 119)** :
```typescript
const isFriendPurpose = discoveryPurpose === 'friend_birthday';
const isOtherEvent = discoveryPurpose === 'other_event';
```

**2. Step labels (ligne 120)** :
```typescript
const stepLabels = ['Accueil', 'Anniversaire', 'Goûts', 'Souhaits', 'Amis',
  isOtherEvent ? 'Événement' : isFriendPurpose ? 'Page proche' : 'Ma page'];
```

**3. État pour le type d'occasion** :
```typescript
const [selectedOccasion, setSelectedOccasion] = useState<string>('wedding');
```

**4. UI de l'étape 5** — ajouter un 3e cas pour `isOtherEvent` :
- Afficher un sélecteur de type d'événement (boutons-chips : Mariage 💍, Baptême 👶, Fiançailles 💑, Diplôme 🎓, Promotion 💼, Autre 🎊)
- Adapter les textes des boutons "Créer page" et "Créer cagnotte" pour refléter l'occasion choisie
- La navigation vers la création de page passera `?occasion=wedding` (ou l'occasion sélectionnée) en paramètre

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter `isOtherEvent` + sélecteur d'occasion + adapter textes étape 5 |

