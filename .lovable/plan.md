## Objectif
Activer automatiquement le son du carrousel vidéo de couverture quand la page est ouverte le jour J de l'anniversaire ou pendant une fête calendaire active — pour l'utilisateur propriétaire comme pour tout visiteur.

## Comportement

- **Par défaut (jours ordinaires)** : muet au chargement (autoplay mobile), l'utilisateur clique pour activer.
- **Jour J de l'anniversaire** (`isBirthdayToday`) OU **fête calendaire active** (au moins une vidéo `calendar_event` dans la playlist correspond à aujourd'hui ±1 jour) : son activé automatiquement au chargement, sans clic.
- L'utilisateur garde la main : s'il coupe le son manuellement, on respecte son choix pour le reste de la session (on n'écrase pas sa décision à chaque vidéo suivante).
- La préférence localStorage (`birthday-cover-muted`) n'est mise à jour que sur action explicite de l'utilisateur — l'auto-unmute du jour J ne pollue pas la préférence globale.
- Si le navigateur bloque l'autoplay avec son (politique mobile stricte), on retombe gracieusement sur muet + le hint "Activer le son" déjà existant.

## Modifications

### `src/components/birthday/CoverVideoCarousel.tsx`
- Ajouter un flag `isSpecialDay` calculé depuis la playlist : `true` si la playlist contient au moins un item dont `schedule_kind` est `birthday_*` ou `calendar_event` actif aujourd'hui.
- Ajouter un ref `userOverrodeMute` (bool) initialisé à `false`, passé à `true` dès que l'utilisateur clique sur le bouton son.
- Au montage et quand `isSpecialDay` devient vrai, si `!userOverrodeMute`, forcer `setMuted(false)` sans toucher au localStorage.
- Sur lecture vidéo : tenter `play()` non-muté ; si la promesse rejette (autoplay bloqué), repasser à `muted = true` et garder le hint visible.
- `toggleMute` marque `userOverrodeMute = true` et écrit dans localStorage comme aujourd'hui.

### `src/utils/coverVideoSchedule.ts`
- Exposer un petit helper `isSpecialDayPlaylist(playlist, birthday, now)` qui retourne `true` si :
  - `isBirthdayToday(birthday, now)`, OU
  - au moins une vidéo de la playlist a `schedule_kind === "calendar_event"` ET `isCalendarEventActive(month, day, now)`.

### Détails techniques
- Aucun changement de schéma DB, aucune migration.
- Aucune modification de la logique de construction de playlist (`buildPlaylist` reste identique).
- Aucun impact sur les autres pages utilisant `CoverVideoCarousel`.
