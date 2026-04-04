
# Plan : Repositionner le bouton WhatsApp pour éviter le chevauchement avec le chat IA

## Probleme

Le bouton WhatsApp flottant est positionne en `bottom-6 right-6`, exactement la ou se trouve le widget de chat IA Lovable. Il est donc masque.

## Solution

Deplacer le bouton WhatsApp en **bas a gauche** (`bottom-6 left-6`) et le transformer en widget plus elabore inspire de l'image de reference : un bouton rond qui, au clic, ouvre une mini-carte avec message de salutation et CTA "Discutons !".

### Design (inspire de l'image)

- Bouton rond en bas a gauche avec icone WhatsApp + gradient violet/rose
- Au clic : popup carte avec :
  - Salutation dynamique (Bonjour/Bon apres-midi/Bonsoir selon l'heure)
  - Message "Besoin d'une idee cadeau ? 🎁"
  - Bouton CTA "Discutons ! ✈️" qui ouvre le lien wa.me
  - Bouton X pour fermer
- Animation d'entree avec framer-motion

### Comportement

- Le popup s'ouvre automatiquement apres 5s (comme le hint actuel) puis se referme apres 8s
- Clic sur le bouton rond : toggle le popup
- Clic sur "Discutons !" : ouvre WhatsApp

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/WhatsAppFloatingButton.tsx` | Refonte complete : position `bottom-6 left-6`, widget avec carte popup |
