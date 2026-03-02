
# Permettre la modification de contribution a la hausse

## Contexte

Actuellement, le modal "Contribuer a la cagnotte" cree toujours une nouvelle contribution dans `fund_contributions`. Un contributeur qui veut augmenter son don cree un doublon. L'objectif est de detecter une contribution existante et permettre une mise a jour du montant (uniquement a la hausse).

## Approche

### 1. Detecter la contribution existante

A l'ouverture du modal, interroger `fund_contributions` pour verifier si l'utilisateur a deja contribue a cette cagnotte :

```sql
SELECT id, amount, message, is_anonymous
FROM fund_contributions
WHERE fund_id = ? AND contributor_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1
```

### 2. Adapter l'interface du modal

**Si contribution existante detectee :**
- Afficher un bandeau informatif : "Vous avez deja contribue X XOF"
- Pre-remplir le champ montant avec la valeur actuelle
- Changer le label en "Nouveau montant de la contribution"
- Ajouter une indication : "Minimum : X XOF (votre don actuel)"
- Le bouton passe de "Contribuer" a "Modifier ma contribution"
- Valider que le nouveau montant est strictement superieur a l'ancien

**Si pas de contribution existante :**
- Comportement actuel inchange

### 3. Logique de mise a jour

Quand une contribution existante est modifiee :
- Calculer le delta : `nouveauMontant - ancienMontant`
- Mettre a jour la ligne existante dans `fund_contributions` via `UPDATE` (au lieu de `INSERT`)
- Le `current_amount` de la cagnotte doit refleter uniquement le delta ajoute
- Mettre a jour le message et le statut anonyme si modifies

```text
Exemple :
- Don initial : 5 000 XOF
- Nouveau montant : 12 000 XOF
- Delta applique a la cagnotte : +7 000 XOF
```

### 4. Validation

- Le nouveau montant doit etre > ancien montant (pas de reduction)
- Le delta ne doit pas depasser le montant restant de la cagnotte
- Le montant total ne doit pas depasser 500 000 XOF

## Modifications techniques

**Fichier** : `src/components/ContributionModal.tsx`

- Ajouter un `useEffect` qui charge la contribution existante a l'ouverture du modal
- Ajouter un state `existingContribution` avec `{ id, amount, message, is_anonymous }`
- Modifier `handleSubmit` pour faire un `UPDATE` si contribution existante, `INSERT` sinon
- Adapter les labels, placeholders, et le bouton selon le mode (creation vs modification)
- Ajuster le calcul du maximum : `remainingAmount + existingAmount` pour la modification

## Resume

- 1 fichier modifie : `src/components/ContributionModal.tsx`
- Aucune migration de base de donnees requise
- La politique RLS existante sur `fund_contributions` devrait permettre le UPDATE par le contributor_id (a verifier, sinon ajout d'une policy UPDATE)
