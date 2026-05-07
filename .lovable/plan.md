## Objectif

Ajouter, dans l'étape de partage de la page d'anniversaire de l'onboarding (étape 7, sous-étape 3 « Partager avec tes amis »), une série de **petites bulles conversationnelles animées et festives** qui mettent en avant les bénéfices émotionnels et concrets du partage, pour pousser l'utilisateur à partager rapidement sa page.

## Où l'ajouter

Fichier : `src/components/OnboardingExperience.tsx`, dans le bloc de la sous-étape 3 « Partager avec tes amis » (autour des lignes 1565–1602), juste au-dessus du bouton « Partager ma page », visible uniquement quand :
- la page est publiée (`isPagePublished === true`)
- et le partage n'est pas encore complet (`shareCount < 3`)

Les bulles disparaissent dès que `shareCount >= 3` (succès atteint).

## Contenu des bulles (tips incitatifs)

Une rotation de 5 messages courts et chaleureux, style chat / WhatsApp, avec emojis festifs. Exemples :

1. 🎁 « Plus tu partages, plus tu reçois de cadeaux et de messages d'amour ! »
2. 💝 « Tes amis ne devineront pas… sauf si tu leur envoies ta page ! »
3. 🎉 « 1 partage = 1 surprise potentielle. Imagine 10 amis, 10 cadeaux ! »
4. ✨ « Ta page est prête : ne la garde pas secrète, fais vibrer ton cercle ! »
5. 🥳 « Les meilleurs anniversaires sont ceux qu'on partage. À toi de jouer ! »

Un seul message visible à la fois, qui change automatiquement toutes les ~3,5 s avec une animation d'apparition (slide + fade) façon bulle de chat. Avatar emoji animé (party popper qui « danse » légèrement) à côté.

## Composant à créer

Nouveau composant léger : `src/components/onboarding/SharingTipsBubbles.tsx`

- Props : aucune (ou `className` optionnel).
- Utilise `framer-motion` (déjà importé dans le projet) pour :
  - `AnimatePresence` + `motion.div` avec animation `initial={{opacity:0, y:8, scale:0.95}}` → `animate={{opacity:1, y:0, scale:1}}` → `exit={{opacity:0, y:-8, scale:0.95}}`.
  - Avatar : `motion.div` avec `animate={{rotate:[0,-10,10,-5,5,0]}}` en boucle (3 s).
- Style : bulle arrondie (`rounded-2xl rounded-tl-sm`) avec dégradé festif `bg-gradient-to-br from-primary/15 via-accent/15 to-heart/15`, bordure `border-primary/20`, ombre douce `shadow-soft`.
- Confettis discrets : un petit `<Sparkles>` qui pulse en haut à droite de la bulle (utiliser `animate-pulse` Tailwind ou keyframes existants).
- Indicateur 3 petits points sous la bulle pour montrer le défilement (purement décoratif, façon chat).

## Intégration

Dans `OnboardingExperience.tsx`, sous-étape 3 :

```tsx
{isPagePublished && shareCount < 3 && (
  <div className="ml-11 space-y-3">
    <SharingTipsBubbles />
    <Button onClick={() => setShowShareSheet(true)} ...>
      <Share2 className="h-4 w-4" /> Partager ma page
    </Button>
  </div>
)}
```

Ajouter l'import en haut du fichier.

## Détails techniques

- Réutilise `framer-motion` (`motion`, `AnimatePresence`) déjà présent dans le fichier.
- Tokens sémantiques uniquement (`primary`, `accent`, `heart`, `muted-foreground`) — aucune couleur en dur.
- Mobile-first : largeur `w-full max-w-sm`, padding `p-3`, texte `text-sm font-nunito`.
- Pas d'appel réseau, pas de dépendance ajoutée.
- Pas de modification de logique métier (compteur de partages, RLS, etc.).

## Vérification

- Préview mobile (375 px) : la bulle s'affiche sous l'item « Partager avec tes amis », au-dessus du bouton, change toutes les 3,5 s, ne casse pas le scroll de la modal.
- Vérifier que la bulle disparaît dès que `shareCount` atteint 3.
- Vérifier qu'aucune autre étape de l'onboarding ne montre les bulles.
