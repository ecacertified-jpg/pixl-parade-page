
# Afficher le nom du créateur au lieu de "Initié par commerce"

## Problème

La cagnotte "Samsung Galaxy A16 pour Marie Belle" a `created_by_business_id` défini en base (car créée via un produit business), mais c'est bien Françoise qui l'a initiée (`creator_id`). Le badge affiche "Initié par commerce" au lieu de "Initié par Françoise".

## Solution

Remplacer le texte du badge par le nom du créateur de la cagnotte, récupéré depuis la table `profiles`.

### Fichier 1 : `src/hooks/useCollectiveFunds.ts`

1. **Ajouter `creatorName?: string` à l'interface `CollectiveFund`** (ligne 33)
2. **Inclure les `creator_id` dans la requête de profils** (wave 3, ligne 141) : fusionner les IDs des contributeurs ET des créateurs pour que les profils des créateurs soient aussi chargés
3. **Mapper `creatorName`** dans l'objet retourné (ligne 210+) : chercher le profil du créateur dans `profilesMap` et formater son nom

### Fichier 2 : `src/components/CollectiveFundCard.tsx`

Remplacer le texte du badge (ligne 205) :
- Avant : `Initié par {fund.businessName || 'commerce'}`
- Après : `Initié par {fund.creatorName || fund.businessName || 'commerce'}`

Cela affichera "Initié par Françoise" quand le profil est disponible, avec fallback sur le nom du commerce puis "commerce".

## Fichiers modifiés

- `src/hooks/useCollectiveFunds.ts` : ajouter champ `creatorName`, inclure créateurs dans le fetch profils
- `src/components/CollectiveFundCard.tsx` : afficher `creatorName` en priorité dans le badge
