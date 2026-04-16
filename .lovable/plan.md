

# Plan : Badges compteurs, bouton Retour, et sections masquables

## 1. Badges compteurs sur les boutons de réaction

### Problème
Les boutons Photo, Vidéo, Souvenir, Cadeau n'affichent pas le nombre d'éléments existants.

### Solution
- Dans `usePagesFeed.ts` : ajouter au type `FeedPage` les compteurs `photo_count`, `video_count`, `memory_count`, `gift_promise_count`
- Compter à partir des données déjà chargées (`birthday_page_photos` / `event_page_photos`) en filtrant par `media_type` (image, video, text/memory)
- Pour `gift_promise_count` : faire un fetch séparé groupé par page depuis `page_gift_promises`
- Dans `FeedCardActions.tsx` : afficher un petit badge (cercle coloré) avec le compteur sur chaque bouton-icône quand > 0

### Fichiers
| Fichier | Changement |
|---------|------------|
| `src/hooks/usePagesFeed.ts` | Ajouter `photo_count`, `video_count`, `memory_count`, `gift_promise_count` au type + mapping. Fetch `media_type` dans les selects et compter par type. Fetch `page_gift_promises` groupé. |
| `src/components/FeedCardActions.tsx` | Afficher badge compteur sur chaque bouton quand `page.photo_count > 0`, etc. |

## 2. Bouton Retour vers le fil après "Voir"

### Problème
Cliquer sur "Voir" navigue vers `/birthday/:slug` ou `/event/:slug`, mais il n'y a pas de moyen explicite de revenir au fil.

### Solution
- Dans `FeedCardActions.tsx` : passer un `state` via `navigate()` quand on clique "Voir" : `navigate(pageUrl, { state: { fromFeed: true } })`
- Dans les pages `BirthdayPage` et `EventPage` : détecter `location.state?.fromFeed` et afficher un bouton "← Retour au fil" en haut qui navigue vers `/home`

### Fichiers
| Fichier | Changement |
|---------|------------|
| `src/components/FeedCardActions.tsx` | Passer `{ state: { fromFeed: true } }` au navigate du bouton "Voir" |
| `src/pages/BirthdayPage.tsx` | Détecter `fromFeed` dans le state, afficher bouton retour vers `/home` |
| `src/pages/EventPage.tsx` | Idem |

## 3. Sections masquables pour Produits en vedette et Expériences Premium

### Problème
Les sections "Produits en vedette" et "Expériences Premium" occupent de l'espace. L'utilisateur souhaite pouvoir les masquer/afficher avec des boutons incitatifs.

### Solution
- Dans `Home.tsx` : entourer chaque section d'un état `showProducts` / `showExperiences` (masqués par défaut)
- Afficher un bouton texte incitatif quand masqué, ex : "🎬 Découvrir les produits vedettes →" et "✨ Explorer les expériences Premium →"
- Cliquer démasque la section complète avec un bouton "Masquer" pour replier

### Fichier
| Fichier | Changement |
|---------|------------|
| `src/pages/Home.tsx` | Ajouter 2 states booléens + boutons toggle incitatifs autour des carousels |

## Résultat attendu
- Chaque bouton-icône affiche un badge numérique (photo, vidéo, souvenir, promesse)
- Le bouton "Voir" navigue avec un state, et la page détaillée affiche un bouton "Retour au fil"
- Les sections produits/expériences sont masquées par défaut avec des CTA attrayants pour les révéler

