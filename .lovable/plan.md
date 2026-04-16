

# Plan : Corriger l'affichage des pages dans le fil d'actualités

## Problème identifié

La page d'anniversaire d'Amtey (créée le 4 avril, avec 8 photos et une cagnotte 100/50000 XOF) n'apparaît pas dans le fil car :
- Il y a **160 pages actives** mais la requête ne récupère que les **50 plus récentes** (`limit(50)`)
- **102 pages** ont été créées après celle d'Amtey → elle est exclue du résultat
- Seulement **5 pages sur 160** ont du contenu réel (photos, couverture ou cagnotte)
- Le tri par contenu se fait côté client, **après** la limite SQL — trop tard

## Solution

Modifier `src/hooks/usePagesFeed.ts` pour prioriser les pages avec contenu **dans la requête**, pas après :

1. **Deux requêtes séquentielles** au lieu d'une seule avec limit(50) :
   - **Requête 1** : Pages avec contenu (fund_id NOT NULL ou photos existantes) — sans limite stricte, triées par date
   - **Requête 2** : Pages récentes sans contenu — limit(20) pour remplir le fil

   Alternativement (plus simple) : **Augmenter la limite à 200** pour couvrir toutes les pages actives, puisqu'il n'y en a que 160. Le tri côté client priorise déjà les pages avec contenu.

2. **Approche recommandée** (simple et efficace) : Changer `limit(50)` → `limit(200)` pour les deux requêtes (birthday + event). Avec 160 pages au total, cela garantit qu'aucune page avec contenu n'est exclue.

## Fichier concerné

| Fichier | Changement |
|---------|------------|
| `src/hooks/usePagesFeed.ts` | Augmenter les limites de requête de 50 à 200 |

## Impact

- Amtey et les 4 autres pages avec contenu apparaîtront en haut du fil (le tri existant les priorise déjà)
- Les pages vides apparaîtront ensuite, triées par date
- Léger surcoût réseau négligeable (160 rows vs 50)

