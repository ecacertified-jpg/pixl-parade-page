
# Correction du Bug : Page Blanche lors de l'Ajout d'Anniversaire

## Probleme Identifie

Quand l'utilisateur clique sur le bouton "Ajouter" dans la carte "Quand est ton anniversaire ?", une page blanche s'affiche.

**Cause** : Le bouton navigue vers `/profile`, une route qui n'existe pas dans l'application.

```text
Code actuel (Dashboard.tsx ligne 504) :
┌──────────────────────────────────────────┐
│ onCompleteProfile={() => navigate('/profile')}  │
└──────────────────────────────────────────┘
                     │
                     ▼
         Route "/profile" inexistante
                     │
                     ▼
            Page NotFound (vide)
```

## Solution Proposee

Utiliser le `CompleteProfileModal` existant au lieu de naviguer vers une route inexistante. Ce modal est deja integre dans le Dashboard et permet d'ajouter la date d'anniversaire.

```text
Solution :
┌──────────────────────────────────────────────────┐
│ Bouton "Ajouter" → Ouvre CompleteProfileModal    │
└──────────────────────────────────────────────────┘
```

## Modifications Techniques

### Fichier a modifier : `src/pages/Dashboard.tsx`

1. **Ajouter un etat pour controler le modal manuellement** :
   - Creer un state `showCompleteProfileModal` pour pouvoir ouvrir le modal depuis le bouton

2. **Modifier le callback `onCompleteProfile`** :
   - Remplacer `navigate('/profile')` par `setShowCompleteProfileModal(true)`

3. **Mettre a jour l'affichage du modal** :
   - Le modal s'ouvrira soit automatiquement (profil incomplet) soit via le bouton "Ajouter"

### Changement de code

| Ligne | Avant | Apres |
|-------|-------|-------|
| ~97 | - | Ajouter state `showCompleteProfileModal` |
| ~504 | `navigate('/profile')` | `setShowCompleteProfileModal(true)` |
| ~848 | `open={needsProfileCompletion && ...}` | `open={(needsProfileCompletion \|\| showCompleteProfileModal) && ...}` |

## Comportement Apres Correction

1. L'utilisateur clique sur "Ajouter" dans la carte anniversaire
2. Le `CompleteProfileModal` s'ouvre
3. L'utilisateur saisit sa date d'anniversaire
4. Le profil est mis a jour et le modal se ferme
5. La carte anniversaire affiche maintenant le compte a rebours

## Fichiers Impactes

| Fichier | Action |
|---------|--------|
| `src/pages/Dashboard.tsx` | Modifier (3 changements mineurs) |

Aucun nouveau fichier a creer. Cette correction utilise le composant modal existant.
