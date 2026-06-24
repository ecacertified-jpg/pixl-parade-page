## Objectif

Aligner la liste de fonctionnalités affichée sur `/pricing` avec la version complète et émotionnelle des 3 plans décrite dans `.lovable/plan.md` (et rappelée par l'utilisateur). Aujourd'hui chaque carte n'affiche que 5–7 lignes condensées, alors que le plan détaillé en prévoit 9–10 par tier (pages, album, cagnottes, invités/RSVP, coulisses, IA, co-organisateurs, branding, partage, support…).

## Changement unique

Modifier `src/pages/Pricing.tsx` — uniquement la constante `FEATURE_ROWS` (lignes ~37-71). Aucun autre fichier touché, aucun changement de logique ni de DB. Pure UI/contenu.

### Nouvelles listes affichées

**Gratuit — "Je commence à célébrer"**
- 1 page anniversaire + 1 page événement
- 20 photos / album · vidéo de couverture standard
- 1 cagnotte active (commission 5 %)
- 30 invités · RSVP simple
- 50 souhaits affichés max
- Coulisses de base : Invités, Souhaits, Album
- 5 suggestions IA / mois
- Partage standard
- Filigrane JDV discret sur exports

**Essentiel — "Je veux préparer en grand"**
- Jusqu'à 5 pages actives (anniversaire + événement)
- 100 photos / album + export PDF souvenir
- Vidéo de couverture personnalisable 720p (upload, trim, musique)
- 3 cagnottes actives · commission réduite 3 %
- 150 invités · RSVP avancé (questions custom, +1, régime)
- Coulisses complètes : Plan de table, Checklist, Budget, Tâches, Prestataires, Messages urgents
- 2 co-organisateurs
- 30 suggestions IA / mois
- Badge public Essentiel + thèmes additionnels
- Support email sous 48 h

**Premium — "Je vis ma joie sans limite"**
- Pages, cagnottes, photos, invités, souhaits & IA illimités
- Vidéo HD 1080p + animations célébration premium
- Export album PDF + vidéo souvenir automatique
- 0 % de commission sur les cagnottes
- Coulisses Premium : Capsules souvenirs, Rétrospective, Plan de table avancé, Livestream LiveKit
- Assistant IA conversationnel illimité
- 10 co-organisateurs
- Thèmes émotionnels exclusifs + halo doré + badge Premium gold
- Sans publicité ni filigrane · prestataires prioritaires
- Support WhatsApp prioritaire sous 24 h

### Notes de rendu
- Les cartes restent stylées comme aujourd'hui (icône check + ligne de texte). L'augmentation de hauteur est acceptable sur mobile : la philosophie « émotionnelle complète » prime sur la concision.
- Pas de modification des prix, du toggle Mensuel/Annuel, du sélecteur EUR/FCFA, ni du CTA Wave.

## Fichiers modifiés
- `src/pages/Pricing.tsx` (constante `FEATURE_ROWS` uniquement)