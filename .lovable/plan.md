

# Plan : Sous-cercles d'amis dans le Tableau de bord

## Concept

Permettre à l'utilisateur de créer des **sous-cercles** (groupes) au sein de son cercle d'amis principal. Chaque contact ne peut appartenir qu'à **un seul** sous-cercle (pas de chevauchement de numéros de téléphone). Le cercle principal reste la vue par défaut — les sous-cercles sont un regroupement optionnel. L'avantage : des cercles distincts peuvent créer des cagnottes indépendantes pour un même bénéficiaire.

## Architecture base de données

Deux nouvelles tables :

```sql
-- Sous-cercles d'amis
CREATE TABLE friend_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7A5DC7',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assignation contact → cercle (un contact = max 1 cercle)
CREATE TABLE friend_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id) -- un contact ne peut être que dans un seul cercle
);
```

RLS : l'utilisateur ne voit/modifie que ses propres cercles (via `friend_circles.user_id = auth.uid()`). Pour `friend_circle_members`, accès via jointure sur `friend_circles.user_id`.

## Changements UI — Dashboard (onglet Amis)

### Section cercles (au-dessus de la liste d'amis)

- **Barre horizontale scrollable** avec des chips : "Tous" (défaut) + chaque sous-cercle créé + bouton "+" pour créer
- Cliquer sur un cercle filtre la liste d'amis pour n'afficher que ses membres
- "Tous" affiche tout le monde (comportement actuel)

### Gestion des cercles

- **Créer un cercle** : petit modal avec nom + couleur optionnelle
- **Ajouter un contact à un cercle** : menu contextuel sur chaque carte d'ami → "Ajouter au cercle" → sélecteur de cercle
- **Validation** : si le contact est déjà dans un autre cercle, afficher un message d'erreur (contacts distincts entre cercles)
- **Supprimer un cercle** : les contacts retournent au cercle principal (non assignés)

### Modifications sur les cartes d'amis

- Petit badge coloré indiquant le cercle d'appartenance (si assigné)
- Bouton pour changer/retirer du cercle

## Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| **Migration SQL** | Tables `friend_circles`, `friend_circle_members` + RLS |
| `src/hooks/useFriendCircles.ts` | **Nouveau** — CRUD cercles + membres |
| `src/components/FriendCircleChips.tsx` | **Nouveau** — Barre de chips filtrable |
| `src/components/CreateCircleModal.tsx` | **Nouveau** — Modal création cercle |
| `src/components/AssignCircleMenu.tsx` | **Nouveau** — Popover pour assigner un contact à un cercle |
| `src/pages/Dashboard.tsx` | Intégrer les chips de cercle dans l'onglet Amis, filtrage par cercle, bouton d'assignation sur chaque carte |
| `src/hooks/useDashboardData.ts` | Charger les cercles et assignations avec les contacts |

## Hook `useFriendCircles`

```typescript
// Opérations principales
createCircle(name, color?) → insert dans friend_circles
deleteCircle(circleId) → delete (membres supprimés en cascade)
addToCircle(circleId, contactId) → insert friend_circle_members (erreur si déjà assigné)
removeFromCircle(contactId) → delete friend_circle_members
getCircles() → liste des cercles avec nombre de membres
```

## Intégration avec les cagnottes

Le filtrage par chevauchement de cercle déjà implémenté dans `useExistingFundsForBeneficiary` fonctionne via `contact_relationships` (qui reste la source de vérité pour les liens d'amitié). Les sous-cercles sont un **regroupement visuel côté utilisateur** — ils ne modifient pas la logique de chevauchement existante, qui continuera de fonctionner correctement car elle est basée sur les contributeurs réels des cagnottes.

