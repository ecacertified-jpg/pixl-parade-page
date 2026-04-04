

# Plan : Bouton Click-to-WhatsApp flottant sur Landing et Auth

## Principe

Ajouter un bouton flottant WhatsApp (lien `wa.me`) en bas à droite de la Landing page et de la page Auth. Le visiteur clique → WhatsApp s'ouvre avec un message pré-rempli → il initie la conversation lui-même (conforme RGPD, pas besoin de collecter son numéro).

## Composant partagé

### Nouveau fichier : `src/components/WhatsAppFloatingButton.tsx`

- Bouton rond flottant `fixed bottom-6 right-6` avec icône WhatsApp (SVG vert)
- Lien `<a href="https://wa.me/NUMERO?text=MESSAGE_PRE_REMPLI" target="_blank">`
- Animation d'entrée avec `framer-motion` (scale + bounce)
- Badge texte optionnel "Besoin d'aide ?" qui apparaît au bout de 5s puis disparaît
- Z-index élevé pour rester au-dessus du contenu
- Style : fond vert WhatsApp `#25D366`, ombre portée, taille 56px

### Message pré-rempli

```
Bonjour ! 👋 Je suis intéressé(e) par JOIE DE VIVRE. J'aimerais en savoir plus.
```

## Intégration

| Fichier | Action |
|---------|--------|
| `src/components/WhatsAppFloatingButton.tsx` | Créer le composant flottant |
| `src/pages/Landing.tsx` | Ajouter `<WhatsAppFloatingButton />` avant la fermeture du JSX |
| `src/pages/Auth.tsx` | Ajouter `<WhatsAppFloatingButton />` avant la fermeture du JSX |

## Props du composant

```typescript
interface WhatsAppFloatingButtonProps {
  phoneNumber: string;       // Numéro au format international (sans +)
  message?: string;          // Message pré-rempli
  showHintDelay?: number;    // Délai avant affichage du hint (ms)
}
```

Le numéro de téléphone sera passé en prop pour rester configurable.

