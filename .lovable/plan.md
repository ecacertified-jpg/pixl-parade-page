## Objectif

Aligner l'expérience visuelle des pages d'événement (mariage en priorité) sur celle des pages d'anniversaire et corriger deux scories d'affichage (carte "Mes coulisses", bouton "Créer une page d'événement").

---

## 1. Hero des pages d'événement (vidéo + couple + compte à rebours)

### 1.1 Rendre `CoverVideoCarousel` générique
Aujourd'hui, `CoverVideoCarousel` est branché sur `birthday_pages` (table `birthday_page_cover_videos` + paramètre `birthday`). On va :

- Ajouter un prop `mode: 'birthday' | 'event'` (défaut `birthday`).
- Quand `mode === 'event'`, le carousel utilisera :
  - `event_date` (au lieu de `birthday`) pour décider du "jour spécial",
  - les vidéos perso de la page d'événement (nouvelle table `event_page_cover_videos`, miroir minimal de la table existante), si on souhaite plus tard laisser le couple uploader ses propres vidéos. Pour le V1 on n'ajoute **pas** la table — uniquement la bibliothèque admin est lue.

### 1.2 Étendre le scheduler vidéo (`utils/coverVideoSchedule.ts`)
Ajout de nouveaux `schedule_kind` :

- `wedding_day`
- `wedding_morning`
- `wedding_afternoon`
- `wedding_evening`
- `wedding_night`

Fonctions ajoutées :
- `isEventToday(event_date, now)` (parsing local YYYY-MM-DD identique à `isBirthdayToday`).
- `currentWeddingKind(now)` (même fenêtres horaires que les greetings).
- Évolution de `buildPlaylist` qui prend désormais un paramètre `context: 'birthday' | 'wedding'` et choisit `wedding_*` vs `birthday_*`. Les greetings restent partagés entre les deux contextes.

### 1.3 Intégration dans `EventPage.tsx`
Remplacer le bloc actuel `cover_image_url ? <img /> : <div emoji />` par :

```
<CoverVideoCarousel
  mode="event"
  birthdayPageId={null}
  birthday={page.event_date /* utilisé comme target_date */}
  fallbackImageUrl={page.cover_image_url}
  className="h-[58vh] min-h-[360px] md:h-[64vh] md:min-h-[460px]"
  overlay={<EventHeroOverlay page={page} creatorProfile={creatorProfile} isWedding={isWedding} />}
/>
```

`EventHeroOverlay` (nouveau composant local) reproduit la disposition de la page anniversaire :
- Pour un mariage : deux avatars côte à côte (créateur + conjoint) avec petit cœur, sinon avatar unique du créateur.
- Titre en blanc : `Mariage de Gnol et Kady` (existant) ou titre simple selon l'occasion.
- Sous-titre optionnel (description courte / `Beau couple`).
- En dessous, **un seul** compte à rebours élégant via `EventCountdown` (cf. ci-dessous). On retire le doublon actuel "📅 7 juin 2026" + emoji bouncing pour ne pas surcharger.

### 1.4 Nouveau composant `EventCountdown`
Basé sur `BirthdayCountdown` mais avec deux affichages selon la proximité :

- `diff > 48h` → pastille compacte `Dans 54 jrs` (label dynamique singulier/pluriel).
- `diff ≤ 48h` (mais > 0) → format complet `02 hrs : 10 min : 45 sec` (mise à jour à la seconde).
- `diff ≤ 0` → libellé `🎉 C'est aujourd'hui !`.

Réutilisé côté birthday plus tard si besoin (on garde `BirthdayCountdown` pour ne rien casser).

---

## 2. Admin — section "Vidéos de mariage"

Dans `src/pages/Admin/AdminCoverVideos.tsx` :

- Ajouter un **onglet** ou un **second bloc** (`<Tabs>` léger) "Anniversaires" / "Mariages". Préférence : tabs pour rester lisible.
- Tab "Mariages" :
  - Sélecteur `kind` limité à : `wedding_day`, `wedding_morning`, `wedding_afternoon`, `wedding_evening`, `wedding_night`, plus `calendar_event` partagé.
  - Form d'upload identique (titre, fichier, génération poster, insertion dans `cover_video_library`).
  - Liste filtrée sur ces kinds.
- Tab "Anniversaires" : comportement actuel (filtré sur kinds existants).
- La table `cover_video_library` n'a **pas** besoin de migration : on s'appuie sur la valeur de `schedule_kind`. Côté DB on ajoute simplement les nouveaux libellés autorisés (si une contrainte CHECK existe — à vérifier ; sinon aucune migration nécessaire). Si un enum/check bloque, créer une migration pour étendre l'enum.

---

## 3. Carte "Mes coulisses" — refonte harmonieuse

Dans `src/components/organization/OrganizationSection.tsx`, le rendu actuel produit un titre cassé sur deux lignes ("Mes / coulisses ✨") + bouton qui pousse la description. Refonte :

```text
┌────────────────────────────────────────────┐
│ ✨  Mes coulisses                          │
│     Préparatifs · prestataires · budget…   │
│                                            │
│                       [ Ouvrir les coulisses ▸ ]
└────────────────────────────────────────────┘
```

Détails :
- Layout vertical (titre + sous-titre alignés à gauche), bouton sur sa propre ligne en pleine largeur sur mobile (`w-full sm:w-auto sm:self-end`).
- Titre sur **une seule ligne** (`text-base font-semibold whitespace-nowrap`), sparkle dans une pastille à gauche.
- Sous-titre raccourci en une phrase avec séparateurs `·`.
- Carte un peu plus aérée (`p-5`, `gap-3`, fond gradient inchangé).

Aucune logique métier modifiée — purement présentation.

---

## 4. Bouton "Créer une page d'événement" lisible

Dans `src/components/MyOtherPagesSection.tsx`, l'état vide affiche un bouton dont le label déborde. Corrections :

- Ajouter `whitespace-normal text-center leading-snug py-3 h-auto` au `Button variant="outline"`.
- Raccourcir le label : `Créer une page d'événement` (le détail "mariage, diplôme, promotion…" passe en `<p className="text-xs text-muted-foreground mt-2">` sous le bouton).
- Conserver le comportement (`navigate('/event/create')`).

---

## Fichiers impactés

- `src/utils/coverVideoSchedule.ts` — nouveaux kinds + `currentWeddingKind` + `buildPlaylist(context)`.
- `src/hooks/useCoverVideoPlaylist.ts` — ajout du paramètre `context` propagé à `buildPlaylist`.
- `src/components/birthday/CoverVideoCarousel.tsx` — props `mode`/`context`, passage à `useCoverVideoPlaylist`.
- `src/components/EventCountdown.tsx` *(nouveau)*.
- `src/components/event/EventHeroOverlay.tsx` *(nouveau)*.
- `src/pages/EventPage.tsx` — remplace l'ancien header par le carousel + overlay + countdown.
- `src/pages/Admin/AdminCoverVideos.tsx` — ajout des tabs Anniversaires/Mariages.
- `src/components/organization/OrganizationSection.tsx` — refonte de la carte.
- `src/components/MyOtherPagesSection.tsx` — bouton créer page lisible.

## Hors périmètre

- Upload de vidéos perso par les couples (table `event_page_cover_videos`) → V2 si demandé.
- Refonte des autres sections (Album souvenir, Messages) — non demandée.
- Aucune modification des données existantes en base.
