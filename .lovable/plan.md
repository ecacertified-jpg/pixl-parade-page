

# Plan : Onboarding incitatif EMOTION → PROJECTION → ACTION → CONFIGURATION

## Contexte actuel

L'app possede deja :
- **Landing page** classique avec features et CTA "Creer mon anniversaire"
- **PreAuthDiscovery** (3 etapes : Imaginez / Page anniversaire mockup / CTA inscription) -- affiche avant le formulaire d'inscription si `discovery=true`
- **Auth.tsx** (formulaire d'inscription classique)
- **OnboardingExperience** (6 etapes post-inscription : Accueil, Anniversaire, Gouts, Souhaits, Amis, Ma Page)

## Objectif

Remplacer le `PreAuthDiscovery` actuel par un parcours de type quiz/enquete inspiré de Blow Up, structure en 4 phases :

```text
EMOTION (landing + entree)
  → PROJECTION (quiz = creuser le besoin)
    → ACTION (inscription)
      → CONFIGURATION (onboarding existant)
```

## Architecture du nouveau parcours

### Phase 1 - EMOTION (ecran d'accroche)
Remplace l'etape 0 actuelle du PreAuthDiscovery. Ecran plein ecran avec :
- Animation de notifications simulees (style Blow Up : messages d'anniversaire qui tombent sur un mockup de telephone)
- Titre emotionnel : "Imagine que tous tes proches se reunissent pour ton anniversaire..."
- Bouton "Commencer" (pas de "Passer")

### Phase 2 - PROJECTION (quiz 4-5 questions)
Nouvelles etapes de quiz, une question par ecran avec barre de progression (style Blow Up) :

1. **"C'est pour..."** → Choix : "Mon anniversaire" / "L'anniversaire d'un proche" / "Un autre evenement"
2. **"Ton anniversaire, c'est..."** → "Dans moins d'un mois" / "Dans 1 a 3 mois" / "Dans plus de 3 mois" / "C'est deja passe"
3. **"Ce qui te ferait le plus plaisir ?"** → "Recevoir des messages de mes proches" / "Un cadeau collectif" / "Une surprise organisee" / "Tout ca !"
4. **"Combien de proches voudrais-tu reunir ?"** → "5-10" / "10-30" / "30-50" / "Plus de 50"
5. **Ecran projection** : "On va creer ta page d'anniversaire personnalisee !" avec courbe de croissance animee (style Blow Up) montrant les contributions/messages qui augmentent + message de validation personnalise selon les reponses

Chaque selection affiche un message d'encouragement vert (comme Blow Up : "C'est l'objectif n1 des utilisateurs...").

### Phase 3 - ACTION (transition vers inscription)
- Ecran recap : "Tout est pret ! Cree ton compte pour lancer ta page d'anniversaire"
- Bouton CTA vers le formulaire d'inscription existant (Auth.tsx)
- Les reponses du quiz sont stockees dans localStorage pour etre utilisees post-inscription

### Phase 4 - CONFIGURATION (existant)
L'onboarding post-inscription existant (OnboardingExperience) reste inchange, mais recoit les donnees du quiz pour pre-remplir certaines etapes (ex: "Dans moins d'un mois" → alerte d'urgence dans l'onboarding).

## Details techniques

### Fichier modifie : `src/components/PreAuthDiscovery.tsx`
- Refonte complete : passer de 3 etapes statiques a ~7 etapes (1 emotion + 5 quiz + 1 projection)
- Chaque question est un ecran plein ecran avec options sous forme de cartes (style Blow Up : fond sombre, bordures arrondies, icone + texte)
- Barre de progression en haut (pourcentage visuel)
- Bouton retour (chevron gauche)
- Au clic sur une option : bordure violette + message vert d'encouragement + bouton "Continuer" s'active
- Les reponses sont stockees dans `localStorage` sous la cle `jdv_discovery_answers`

### Fichier modifie : `src/pages/Landing.tsx`
- Le CTA principal "Creer mon anniversaire" pointe deja vers `?discovery=true` → pas de changement

### Fichier modifie : `src/pages/Auth.tsx`
- Apres inscription reussie, lire `jdv_discovery_answers` pour adapter le parcours onboarding

### Style visuel (inspire de Blow Up)
- Fond sombre ou gradient subtil (utilisation du theme existant dark/light)
- Options en cartes avec icone a gauche, texte a droite, bordure arrondie
- Selection = bordure primaire (violette) + apparition d'un message d'encouragement vert sous l'option selectionnee
- Barre de progression lineaire en haut avec pastille d'etape
- Transitions fluides entre etapes (slide horizontal avec framer-motion)
- Pas de scroll : tout tient dans un ecran

### Donnees stockees
```typescript
interface DiscoveryAnswers {
  purpose: 'my_birthday' | 'friend_birthday' | 'other_event';
  timing: 'less_1_month' | '1_to_3_months' | 'more_3_months' | 'already_passed';
  desire: 'messages' | 'collective_gift' | 'surprise' | 'everything';
  guest_count: '5_10' | '10_30' | '30_50' | '50_plus';
}
```

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| `src/components/PreAuthDiscovery.tsx` | Refonte complete avec quiz 7 etapes |
| `src/pages/Auth.tsx` | Lire reponses quiz post-inscription (mineur) |

