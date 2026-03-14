

# Plan : Permettre les cagnottes multiples pour cercles d'amis distincts

## Concept

Actuellement, l'alerte `ExistingFundsAlert` affiche **toutes** les cagnottes actives pour un même bénéficiaire, bloquant implicitement la création. Le changement consiste à filtrer cette liste : ne montrer que les cagnottes dont le cercle de contributeurs **chevauche** celui de l'utilisateur courant. Si aucun chevauchement, pas d'alerte — la création est directe.

## Logique de chevauchement

```text
Cercle de l'utilisateur = ses contacts (contact_relationships: user_a/user_b)
Cercle d'un fund existant = creator_id + contributor_ids (fund_contributions)

Chevauchement = intersection(cercle_utilisateur, cercle_fund) ≠ ∅
→ Si chevauchement : afficher l'alerte (risque de doublon)
→ Si aucun chevauchement : masquer ce fund de l'alerte
```

## Fichiers impactés

### 1. `src/hooks/useExistingFundsForBeneficiary.ts`

- Modifier `checkFundsByContactId` et `checkFundsByUserId` pour :
  1. Après avoir récupéré les fonds existants, récupérer les `contributor_id` de chaque fund via `fund_contributions`
  2. Récupérer le cercle d'amis de l'utilisateur courant via `contact_relationships`
  3. Convertir les contacts en `user_id` (via `contacts.linked_user_id`) pour comparer avec les contributeurs
  4. Ne garder que les funds dont au moins un contributeur ou le créateur appartient au cercle de l'utilisateur
- Ajouter `userId` en paramètre (l'utilisateur courant) pour pouvoir charger son cercle

### 2. `src/components/CollaborativeGiftModal.tsx`

- Passer `user.id` à `checkFundsByContactId` pour activer le filtrage par cercle

### 3. `src/components/BusinessCollaborativeGiftModal.tsx`

- Idem : passer `user.id` à `checkFundsByUserId`

## Détail technique — `useExistingFundsForBeneficiary.ts`

```typescript
// Nouvelle signature
const checkFundsByContactId = async (contactId: string, currentUserId: string) => {
  // ... existing fund fetching logic ...
  
  // NEW: Filter by circle overlap
  const filteredFunds = await filterByCircleOverlap(allUniqueFunds, currentUserId);
  setExistingFunds(formatFunds(filteredFunds));
};

async function filterByCircleOverlap(funds: any[], currentUserId: string) {
  if (funds.length === 0) return funds;
  
  // 1. Get current user's friend circle (user IDs)
  const { data: relationships } = await supabase
    .from('contact_relationships')
    .select('user_a, user_b')
    .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`);
  
  const friendIds = new Set(
    (relationships || []).map(r => r.user_a === currentUserId ? r.user_b : r.user_a)
  );
  friendIds.add(currentUserId); // include self
  
  // 2. Get contributors for each fund
  const fundIds = funds.map(f => f.id);
  const { data: contributions } = await supabase
    .from('fund_contributions')
    .select('fund_id, contributor_id')
    .in('fund_id', fundIds);
  
  // 3. For each fund, check if creator or any contributor is in user's circle
  return funds.filter(fund => {
    const fundPeople = new Set<string>();
    fundPeople.add(fund.creator_id);
    (contributions || [])
      .filter(c => c.fund_id === fund.id)
      .forEach(c => fundPeople.add(c.contributor_id));
    
    // Check overlap: at least one person in common
    for (const person of fundPeople) {
      if (friendIds.has(person)) return true;
    }
    return false;
  });
}
```

## Résultat attendu

- **Cercles qui se chevauchent** : l'alerte s'affiche comme avant (évite les doublons)
- **Cercles totalement distincts** : aucune alerte, la création est immédiate (chaque groupe d'amis peut organiser sa propre cagnotte surprise indépendamment)

