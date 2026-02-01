

# Utilisation du Sélecteur de Date Natif sur Mobile

## Objectif

Modifier le composant `BirthdayPicker` pour utiliser le sélecteur de date **natif du navigateur** (`<input type="date">`) sur mobile, comme montré dans la capture d'écran du formulaire d'inscription. Cela offre une meilleure expérience utilisateur sur smartphone car le picker natif est familier et optimisé pour l'écran tactile.

## Situation Actuelle

Le composant `BirthdayPicker` actuel utilise :
- Un champ texte avec auto-formatage (jj/mm/aaaa)
- Un bouton calendrier qui ouvre un `Popover` avec le composant `Calendar`
- Validation en temps réel

Ce composant est utilisé dans 4 endroits :
1. `CompleteProfileModal.tsx` - Modal de complétion de profil
2. `ProfileSettings.tsx` - Page des paramètres du profil
3. `AddEventModal.tsx` - Ajout d'événement
4. `AddFriendModal.tsx` - Ajout d'un ami

## Solution Proposee

Modifier `BirthdayPicker` pour :
- **Mobile** : Utiliser `<input type="date">` natif avec une icône calendrier intégrée
- **Desktop** : Conserver le comportement actuel (saisie texte + popover calendrier)

```text
┌─────────────────────────────────────────────────────┐
│                    BirthdayPicker                   │
│                                                     │
│  ┌─────────────────┐     ┌─────────────────────┐   │
│  │    Desktop      │     │       Mobile        │   │
│  ├─────────────────┤     ├─────────────────────┤   │
│  │ Input texte     │     │ Input type="date"   │   │
│  │ + Bouton 📅     │     │ (picker natif OS)   │   │
│  │ + Popover       │     │                     │   │
│  │   Calendar      │     │  ┌─────────────┐    │   │
│  │                 │     │  │ jj/mm/aaaa 📅│    │   │
│  └─────────────────┘     │  └─────────────┘    │   │
│                          └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Details Techniques

### Modification du Composant BirthdayPicker

**Fichier** : `src/components/ui/birthday-picker.tsx`

Changements :
1. Importer le hook `useIsMobile` depuis `@/hooks/use-mobile`
2. Ajouter un rendu conditionnel selon `isMobile`
3. Pour mobile : utiliser `<input type="date">` avec :
   - Valeur au format `yyyy-MM-dd` (format HTML5)
   - Affichage stylé pour correspondre au design system
   - Validation identique au mode desktop
4. Pour desktop : conserver le comportement actuel

### Avantages du Picker Natif sur Mobile

| Aspect | Picker Actuel | Picker Natif |
|--------|---------------|--------------|
| UX | Saisie manuelle | Roues/calendrier natif |
| Familiarité | Nouvelle UI | UI système connue |
| Accessibilité | Correcte | Optimisée par l'OS |
| Taille touch | Petits boutons | Cibles adaptées |

## Fichiers Impactes

| Fichier | Action |
|---------|--------|
| `src/components/ui/birthday-picker.tsx` | Modifier |

Aucun autre fichier n'a besoin d'être modifié car tous les formulaires utilisent déjà le composant `BirthdayPicker` de manière centralisée.

## Comportement Attendu

### Sur Mobile (largeur < 768px)
- Affichage d'un input natif `type="date"` 
- Au tap, le picker de date du système s'ouvre (roues sur iOS, calendrier sur Android)
- Le placeholder "jj/mm/aaaa" s'affiche si pas de valeur
- La validation reste identique (min/max année, pas de date future, etc.)

### Sur Desktop (largeur >= 768px)
- Comportement inchangé : saisie texte avec auto-formatage + bouton calendrier popover

## Implementation

Le composant utilisera `useIsMobile()` pour détecter la plateforme et rendra soit :

```text
Mobile:
┌────────────────────────────┐
│ jj/mm/aaaa              📅 │  <- input type="date"
└────────────────────────────┘

Desktop:
┌──────────────────────┐ ┌──┐
│ jj/mm/aaaa           │ │📅│  <- input text + button
└──────────────────────┘ └──┘
```

Cette approche garantit une cohérence visuelle tout en offrant la meilleure expérience native sur mobile.

