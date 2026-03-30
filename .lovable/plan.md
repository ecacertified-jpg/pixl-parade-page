# Plan : Invitation via formulaire ami à l'étape 5 + Célébration post-soumission

## Partie 1 : Étape 5 (Amis) — Ajout du partage de formulaire ami

### Objectif

Permettre à l'utilisateur d'inviter un proche via un lien `fill-friend-info` (formulaire auto-rempli) depuis l'étape 5 de l'onboarding, en supprimant l'invitation par téléphone existante. Afficher "+1 invitation(s) envoyée(s)" au lieu de "+1 ami(s) invité(s)" lors de l'envoi via les réseaux sociaux.

### Modifications dans `src/components/OnboardingExperience.tsx`

1. **Ajouter un état pour le lien du formulaire ami** :
  - `friendFormLink` (string | null) — lien généré via `friend_form_tokens`
  - `invitationsSentCount` (number) — compteur d'invitations envoyées via partage social
2. **Créer une fonction `handleGenerateFriendFormLink**` :
  - Insère dans `friend_form_tokens` (comme dans `AddFriendModal.handleShareForm`)
  - Génère le lien `/fill-friend-info/:token`
  - Utilise `getAppBaseUrl()` pour le lien
3. **Ajouter un bloc UI** dans l'étape 4 (currentStep === 4, qui correspond à l'étape 5 visuellement) :
  - Bouton "Envoyer à un proche pour qu'il complète" (style similaire à AddFriendModal)
  - Quand cliqué : génère le lien, affiche les options de partage (WhatsApp, copier, etc.)
  - Icônes de partage social (WhatsApp, Facebook, LinkedIn, Email, SMS, Copier)
4. **Modifier le compteur** (lignes 688-698) :
  - Afficher "+{invitationsSentCount} invitation(s) envoyée(s) 🎉" quand le partage social est utilisé
  - Conserver "+{invitedCount} ami(s) invité(s)" pour l'ajout par téléphone
  - Combiner les deux compteurs si les deux sont utilisés
5. **Incrémenter `invitationsSentCount**` à chaque clic sur un bouton de partage social (WhatsApp, copier, etc.)

---

## Partie 2 : Page `FillFriendForm` — Célébration post-soumission

### Objectif

Après soumission réussie du formulaire, remplacer l'écran de confirmation simple par une séquence festive en 2 temps avec confettis, puis un CTA vers l'inscription.

### Modifications dans `src/pages/FillFriendForm.tsx`

1. **Ajouter un état `celebrationPhase**` : `'confetti' | 'cta' | null`
2. **Phase 1 — Confettis + Message festif** (durée ~3s) :
  - Déclencher `canvas-confetti` (burst intense)
  - Afficher avec animation (fade-in + scale) : "Bravo ! Ton ami(e) n'oubliera plus ton anniversaire 🎉"
  - Icône CheckCircle2 animée
3. **Phase 2 — Transition harmonieuse** (après 3s) :
  - Les confettis s'estompent naturellement
  - Le premier message fait un fade-out doux
  - Nouveau message fade-in : "Et si PLUSIEURS de tes proches se souvenaient de ton anniversaire ? Imagine un peu ce qui t'attend !"
  - Bouton "Créer mon anniversaire" avec un bandeau "Découvrez JDV"
  - Le bouton redirige vers `/auth?discovery=true`
4. **Style du bouton CTA** :
  - Gradient primary → accent
  - Badge/bandeau "Découvrez JDV" au-dessus du bouton
  - Animation pulse subtile pour attirer l'attention

### Structure du rendu `submitted`

```text
┌─────────────────────────┐
│   Phase 1 (0-3s)        │
│   🎉 Confettis          │
│   ✅ "Bravo ! Ton ami…" │
│                         │
│   Phase 2 (3s+)         │
│   "Et si PLUSIEURS…"   │
│   ┌───────────────────┐ │
│   │ Découvrez JDV     │ │
│   │ Créer mon anniv.  │ │
│   └───────────────────┘ │
└─────────────────────────┘
```

## Fichiers concernés


| Fichier                                   | Action                                                |
| ----------------------------------------- | ----------------------------------------------------- |
| `src/components/OnboardingExperience.tsx` | Ajouter partage formulaire ami + compteur invitations |
| `src/pages/FillFriendForm.tsx`            | Célébration post-soumission en 2 phases avec CTA      |
