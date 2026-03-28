

# Plan : Onboarding de decouverte avant inscription (Pre-Auth Experience)

## Probleme

Actuellement, l'onboarding immersif ne se declenche qu'apres l'inscription. Les visiteurs arrivent sur `/auth` et voient un formulaire froid. Aucune raison emotionnelle de s'inscrire.

## Concept : "Decouvrir avant de s'inscrire"

Ajouter une **experience de decouverte interactive** accessible AVANT l'inscription, directement sur la page Auth. Le visiteur vit une mini-experience qui lui montre la valeur de JDV, puis est naturellement guide vers l'inscription.

```text
Visiteur arrive sur /auth
  → Voit un bouton "Decouvrir JDV" sous le formulaire
  → Lance une experience immersive en 3 ecrans :
      1. "Imaginez..." — animation festive + proposition de valeur
      2. "Votre prochain anniversaire" — apercu interactif d'une page anniversaire
      3. "Pret a commencer ?" — CTA d'inscription avec incentive
  → Retour au formulaire d'inscription, motive
```

## Modifications

### 1. Nouveau composant `src/components/PreAuthDiscovery.tsx`

Experience immersive en 3 etapes (sans authentification requise) :

- **Ecran 1 — "Imaginez..."** : Animation de confettis + particules flottantes. Texte emotionnel : "Imaginez que tous vos proches se reunissent pour celebrer votre anniversaire...". Bouton "Voir comment".

- **Ecran 2 — "Votre page anniversaire"** : Apercu interactif d'une fausse page anniversaire avec mur de messages pre-remplis, album photo, barre de cagnotte animee. Le visiteur peut interagir (scroller, voir les messages). Texte : "Chaque anniversaire devient une celebration collective".

- **Ecran 3 — "Pret a vivre ca ?"** : Resume des benefices (page virale, album souvenir, cagnotte collective, notifications). Bouton CTA principal "Creer mon compte gratuitement" qui ferme la decouverte et focus le formulaire d'inscription. Bouton secondaire "Voir un exemple reel" qui redirige vers une page anniversaire publique existante.

Le composant utilise Framer Motion pour les transitions, confetti pour l'ecran 1, et des donnees fictives pour l'apercu.

### 2. Modification `src/pages/Auth.tsx`

- Ajouter un bouton "Decouvrir JDV en 30 secondes" sous le formulaire d'inscription (onglet signup uniquement).
- Ce bouton ouvre `<PreAuthDiscovery />` en plein ecran.
- Quand le visiteur termine la decouverte, le formulaire d'inscription recoit le focus automatiquement.
- Stocker dans `localStorage` (`jdv_discovery_seen`) pour ne pas re-proposer.

### 3. Enrichir la page `/auth` avec un apercu visuel

- Ajouter une section "teaser" au-dessus du formulaire (mobile) ou a cote (desktop) montrant des elements visuels attrayants : mini-apercu de page anniversaire, compteur anime de "celebrations creees", temoignages courts.

## Details techniques

- **Aucune base de donnees** requise — tout est cote client avec des donnees fictives.
- **Donnees fictives** pour l'apercu : 3 messages d'anniversaire pre-ecrits, 4 photos placeholder, une barre de cagnotte a 65%.
- **Performance** : Lazy-load du composant PreAuthDiscovery (React.lazy) car il inclut confetti + animations.
- **Analytics** : Tracker `discovery_started` et `discovery_completed` via le hook useGoogleAnalytics existant pour mesurer la conversion.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/PreAuthDiscovery.tsx` | Nouveau — experience de decouverte en 3 ecrans |
| `src/pages/Auth.tsx` | Ajout bouton "Decouvrir JDV" + section teaser visuelle |

