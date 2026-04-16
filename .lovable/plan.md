

# Plan : Adapter l'onboarding selon le choix "Mon anniversaire" vs "Anniversaire d'un proche"

## Constat

Le quiz pré-inscription (`PreAuthDiscovery`) sauvegarde les réponses dans `localStorage('jdv_discovery_answers')` mais l'onboarding post-inscription (`OnboardingExperience`) ne les lit jamais. Le parcours est identique quel que soit le choix de l'utilisateur.

## Ce qui va changer

L'onboarding lira le `purpose` du quiz et adaptera l'étape 5 ("Ma Page") :

- **`my_birthday`** (défaut) : parcours actuel inchangé — créer SA page d'anniversaire, SA cagnotte, partager avec ses proches
- **`friend_birthday`** : l'étape 5 devient "Page pour ton proche" — l'utilisateur crée une page d'anniversaire pour son proche (surprise ou non), crée une cagnotte au nom du proche, et partage avec les autres amis du proche

Les étapes 1-4 (Accueil, Anniversaire, Goûts, Souhaits, Amis) restent identiques car elles concernent le profil de l'utilisateur lui-même.

## Détails techniques

### Fichier : `src/components/OnboardingExperience.tsx`

1. **Lire le purpose au montage** : dans le `useEffect` initial, parser `localStorage.getItem('jdv_discovery_answers')` et extraire `purpose`
2. **Stocker dans un state** : `const [discoveryPurpose, setDiscoveryPurpose] = useState<string>('my_birthday')`
3. **Adapter l'étape 5 (step 5)** selon `discoveryPurpose` :
   - Si `friend_birthday` :
     - Titre : "Crée une page pour ton proche 🎁"
     - Description : "Organise une surprise pour l'anniversaire de ton proche"
     - Bouton création page : "Créer la page de mon proche" → navigue vers `/birthday/create?for=friend` (ou ouvre le flow existant avec un flag)
     - Bouton cagnotte : "Lancer une cagnotte pour mon proche"
   - Si `my_birthday` ou absent : parcours actuel inchangé

4. **Création de page pour un proche** : le bouton "Créer la page de mon proche" appellera `onComplete()` puis naviguera vers la page de création d'anniversaire avec un paramètre indiquant que c'est pour un contact (réutiliser le flow existant de création de birthday page)

### Fichier : `src/components/PreAuthDiscovery.tsx`

Aucun changement — les données sont déjà sauvegardées correctement.

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Lire `jdv_discovery_answers.purpose` + adapter le contenu de l'étape 5 |

