
# Barre de progression circulaire autour du timer OTP

## Concept

Remplacer le simple texte "Renvoyer dans 4:59" par un composant visuel avec un cercle SVG animé qui se vide progressivement sur 5 minutes, avec le timer affiche au centre. Quand le decompte atteint 0, le cercle disparait et le bouton "Renvoyer le code" redevient cliquable.

## Composant a creer

### `src/components/auth/OtpCountdownCircle.tsx`

Un composant reutilisable qui affiche :
- Un cercle SVG (50px de diametre) avec un trait de progression qui diminue de 100% a 0%
- Le timer en format `m:ss` au centre du cercle
- Couleur primaire (violet) pour la progression, muted pour le fond du cercle
- Quand le countdown atteint 0 : afficher le bouton "Renvoyer le code" a la place

Props :
- `countdown: number` (secondes restantes)
- `total: number` (duree totale, 300)
- `onResend: () => void`
- `disabled: boolean`

Le cercle utilise `stroke-dasharray` et `stroke-dashoffset` sur un `<circle>` SVG, avec une transition CSS fluide.

## Fichiers impactes

1. **`src/components/auth/OtpCountdownCircle.tsx`** (nouveau) : composant cercle + timer
2. **`src/pages/Auth.tsx`** : remplacer le bouton texte "Renvoyer dans X:XX" par `<OtpCountdownCircle />`
3. **`src/pages/BusinessAuth.tsx`** : meme remplacement

## Rendu visuel

```text
        ╭───────╮
       ╱  4:32   ╲       <-- cercle avec progression
      │           │           qui diminue dans le sens
       ╲         ╱            horaire
        ╰───────╯
    Renvoyer le code      <-- texte sous le cercle
    (grise tant que > 0)
```

Quand le timer atteint 0, le cercle disparait et le bouton "Renvoyer le code" devient actif avec la couleur primaire.

## Details techniques

- Cercle SVG : rayon 22px, stroke-width 3px, viewBox 50x50
- `stroke-dasharray = 2 * PI * rayon` (perimetre)
- `stroke-dashoffset = perimetre * (1 - countdown / total)` pour vider le cercle
- Transition CSS `stroke-dashoffset 1s linear` pour un mouvement fluide
- Couleurs : `stroke` en `hsl(var(--primary))` pour la progression, `hsl(var(--muted))` pour le fond
- Le bouton "Modifier le numero" reste inchange en dessous
