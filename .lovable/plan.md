

# Plan : Ajouter des checkboxes aux contacts individuels dans le modal de partage

## Probleme

Les contacts individuels (Chandy, Meera) sont affiches en lecture seule (simple `div`) sans checkbox, contrairement aux cercles. L'utilisateur ne peut donc pas les selectionner.

## Solution

Ajouter un state `selectedContacts`, des checkboxes sur chaque contact, et inclure les contacts selectionnes dans le compteur. Le bouton WhatsApp enverra le message viral pour les contacts selectionnes (ouverture WhatsApp pre-rempli avec leur numero).

### Modifications dans `src/components/ShareBirthdayToCirclesModal.tsx`

1. Ajouter `selectedContacts` state (`string[]`)
2. Ajouter `toggleContact` handler
3. Transformer les `div` des contacts en `label` avec `Checkbox` (meme pattern que les cercles)
4. Mettre a jour le compteur `totalSelected` pour inclure les contacts selectionnes
5. Adapter `handleShareWhatsApp` : si des contacts avec numero sont selectionnes, ouvrir WhatsApp directement vers leur numero (`https://wa.me/{phone}?text=...`), sinon comportement actuel

