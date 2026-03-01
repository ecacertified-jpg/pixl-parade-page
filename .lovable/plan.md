

# Detection de doublons de cagnottes

## Objectif

Quand un utilisateur selectionne un beneficiaire pour creer une cagnotte, verifier s'il existe deja une cagnotte active pour cette personne et proposer de la rejoindre (contribuer) plutot que d'en creer une nouvelle.

## Flux utilisateur

1. L'utilisateur choisit un produit dans la boutique et clique "Organiser une cotisation"
2. Dans le modal de selection du beneficiaire (`CollaborativeGiftModal`), il choisit un contact
3. **NOUVEAU** : Avant d'afficher le bouton "Demarrer une cotisation", on verifie s'il existe deja une cagnotte active pour ce contact
4. Si des cagnottes existent :
   - Afficher une alerte avec la liste des cagnottes existantes (titre, montant actuel/objectif, createur)
   - Bouton "Rejoindre cette cagnotte" qui ouvre le flux de contribution
   - Bouton "Creer quand meme" pour ignorer et continuer la creation
5. Si aucune cagnotte n'existe : comportement actuel inchange

## Plan technique

### Etape 1 -- Hook `useExistingFundsForBeneficiary`

Nouveau fichier `src/hooks/useExistingFundsForBeneficiary.ts` :

- Fonction `checkExistingFunds(contactId: string)` qui interroge `collective_funds` :
  ```sql
  SELECT cf.*, p.first_name, p.last_name, p.avatar_url
  FROM collective_funds cf
  LEFT JOIN profiles p ON p.user_id = cf.creator_id
  WHERE cf.beneficiary_contact_id = contactId
    AND cf.status = 'active'
  ```
- Aussi chercher par `linked_user_id` du contact : si le contact a un `linked_user_id`, chercher egalement les cagnottes ou un autre contact avec le meme `linked_user_id` est beneficiaire
- Retourne : `existingFunds[]`, `loading`, `checkFunds(contactId)`

### Etape 2 -- Composant `ExistingFundsAlert`

Nouveau fichier `src/components/ExistingFundsAlert.tsx` :

- Carte d'alerte affichee entre la selection du contact et le bouton d'action
- Icone d'avertissement avec texte "Une cagnotte existe deja pour [nom]"
- Pour chaque cagnotte existante : titre, barre de progression, montant, nom du createur
- Bouton "Contribuer a cette cagnotte" (primary, ouvre `ContributionModal`)
- Bouton "Creer une nouvelle cagnotte" (outline/secondary, continue le flux normal)
- Style : fond jaune/ambre pour attirer l'attention, coherent avec le design system

### Etape 3 -- Integration dans `CollaborativeGiftModal`

Modifier `src/components/CollaborativeGiftModal.tsx` :

- Importer et utiliser `useExistingFundsForBeneficiary`
- Quand `handleSelectContact` est appele, lancer `checkFunds(contact.id)`
- Si des fonds existent, afficher `ExistingFundsAlert` a la place du bouton "Demarrer une cotisation"
- Ajouter un `ContributionModal` pour permettre la contribution directe depuis ce modal
- Quand l'utilisateur clique "Creer quand meme", afficher le bouton normal de creation

### Etape 4 -- Integration dans `BusinessCollaborativeGiftModal`

Modifier `src/components/BusinessCollaborativeGiftModal.tsx` :

- Meme logique : quand un utilisateur beneficiaire est selectionne, verifier les cagnottes existantes via son `user_id`
- Afficher `ExistingFundsAlert` si des cagnottes existent
- Adapter la recherche pour utiliser `user_id` au lieu de `contact_id` (les business funds utilisent des profils, pas des contacts)

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/hooks/useExistingFundsForBeneficiary.ts` | Creer -- logique de detection |
| `src/components/ExistingFundsAlert.tsx` | Creer -- UI d'alerte avec options |
| `src/components/CollaborativeGiftModal.tsx` | Modifier -- integrer la detection |
| `src/components/BusinessCollaborativeGiftModal.tsx` | Modifier -- integrer la detection |

### Aucune migration SQL necessaire

Les colonnes `beneficiary_contact_id`, `status`, `creator_id` existent deja dans `collective_funds`. La recherche par `linked_user_id` utilise la table `contacts` existante.

