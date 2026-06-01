# Plan — Pages multi-événements, cagnottes multiples, conversion visiteur

## 1. Cagnottes multiples par page (anniversaire & événement)

**Comportement** : L'utilisateur peut créer plusieurs cagnottes (pour lui ou pour un proche). Sa page d'anniversaire (1/an) n'affiche **qu'une** cagnotte à la fois — celle qu'il a sélectionnée comme "cagnotte mise en avant".

**UI** :
- Section "Cagnotte" de la page d'anniversaire (et page d'événement) : si propriétaire, ajouter au-dessus du bloc cagnotte un **Select** (shadcn) listant ses cagnottes actives (filtrées par `creator_id = user_id`, `status = 'active'`, et par défaut occasion compatible).
- Option "+ Créer une nouvelle cagnotte" en fin de liste → flow existant `/gifts`.
- Pour les visiteurs : aucune liste, seule la cagnotte sélectionnée s'affiche.

**Données** :
- Le champ `birthday_pages.fund_id` (et `event_pages.fund_id`) existe déjà → on l'utilise comme **cagnotte mise en avant**. Le Select fait juste un `UPDATE` sur ce champ.
- Aucune migration nécessaire pour ce point ; pas de changement à la logique de création de cagnottes (déjà multi).

## 2. Pages d'événements multiples liées à l'utilisateur

**Types supportés** (réutilise `ALBUM_EVENT_KINDS` existant) : mariage (trad / religieux / civil), réussite académique/scolaire, promotion pro. La page d'anniversaire reste plafonnée à 1/an ; les autres types sont illimités.

**Point d'entrée du bouton "Ajouter une page d'événement"** :
- **Proposition principale** : dans le **menu d'actions rapides** `CreateActionMenu.tsx` (qui contient déjà "Ma page d'anniversaire" + "Inviter des amis"), ajouter une 3ᵉ entrée **"Créer une page d'événement"** avec icône `PartyPopper` → ouvre `/event/new` (page `CreateEventPage` déjà existante, à étendre avec sélecteur de type).
- **Point secondaire** : sur la page d'anniversaire du propriétaire, dans la section "Mes autres pages" (nouvelle, voir ci-dessous), un bouton "+ Ajouter une page d'événement".

**Design des pages d'événements** :
- `EventPage.tsx` existe déjà mais minimaliste → l'aligner sur `BirthdayPage.tsx` : carrousel vidéos de couverture, photo de profil, cagnotte (avec Select multi-cagnottes du point 1), mur de messages, album souvenir.
- **Cas mariage** : ajouter champ `spouse_profile` (nom + avatar) sur `event_pages` quand `occasion IN ('mariage_*')` → affiche **2 avatars** côte à côte.

**Liaison entre pages d'un même utilisateur** :
- Nouvelle section **"Mes autres pages"** (carrousel horizontal de cartes type `BirthdayGridCard`) affichée :
  - sur la page d'anniversaire de l'utilisateur (visible par tous, mais surtout pour le propriétaire et ses visiteurs)
  - sur chaque page d'événement créée par le même `creator_id`
- Source : hook `useMyPublishedPages(userId)` existe déjà → réutilisé tel quel.
- Texte : "Voir aussi : Mariage de Aminata · Promotion de Koffi · …"

**Album partagé (cross-pages)** :
- Schéma : `birthday_page_photos.event_kind` existe déjà (catalogue dans `album-event-kinds.ts`). Étendre la sémantique : un média téléversé sur la page de mariage est tagué `event_kind='mariage_*'` ET reste rattaché à `birthday_page_id` de l'événement. 
- Pour la page d'anniversaire, la section "Album souvenir" affiche : photos du `birthday_page_id` courant + **agrégat** des photos de toutes les autres pages du même `creator_id` (groupées par `event_kind`, filtre/onglet).
- Pour la page de mariage, idem : album du mariage + photos d'anniversaire du même créateur dans un onglet "Anniversaires".
- Implémentation : nouvelle vue/RPC `get_user_album_aggregate(p_user_id, p_current_page_id)` qui union les photos des `birthday_pages` + `event_page_photos` du même créateur, retournant `event_kind` pour le groupement UI.

## 3. Inciter le visiteur à créer sa propre page

**Comportement** : Quand un visiteur **non authentifié** consulte une page (`/birthday/:slug` ou `/event/:slug`), afficher :
- **Bannière sticky en bas** (mobile) / **CTA en fin de page** : 
  > 🎂 *"Toi aussi, crée ta page d'anniversaire et reçois des cadeaux de tes proches !"*  
  > [Bouton] **Créer ma page gratuitement**
- **Modale "exit intent" / après 15 sec de scroll** : même message + témoignage social ("+1200 pages créées ce mois").
- Lien vers `/auth?tab=signup&returnTo=/dashboard&intent=create_birthday_page&ref=visitor_<slug>`.
- Tracking : enregistrer `acquisition_source='visitor_page'` + slug d'origine pour attribution (table `acquisition_events` existante via `useAcquisitionTracking`).

**Variante contextuelle** : si la page consultée est un **mariage**, le CTA propose : *"Crée ta page de mariage ou d'anniversaire"*.

## Détails techniques

### Migrations DB
1. `event_pages` : ajouter `spouse_first_name text`, `spouse_avatar_url text`, `spouse_user_id uuid` (nullable, pour conjoint inscrit). 
2. RPC `get_user_album_aggregate(p_user_id uuid)` SECURITY DEFINER qui union `birthday_page_photos` + `event_page_photos` filtrés par `creator_id`, retourne `(media_url, event_kind, source_page_id, source_page_type, created_at)`.
3. Aucune nouvelle table : on réutilise `event_pages`, `event_page_photos`, `event_wishes_messages`, `collective_funds`.

### Fichiers à modifier / créer
- `src/components/CreateActionMenu.tsx` — ajouter entrée "Créer une page d'événement".
- `src/pages/CreateEventPage.tsx` — sélecteur de type (Select des `ALBUM_EVENT_KINDS`), champs conjoint conditionnels pour mariage.
- `src/pages/EventPage.tsx` — refonte pour matcher le design de `BirthdayPage` (cover videos carousel, sections cagnotte/messages/album, 2 avatars si mariage).
- `src/pages/BirthdayPage.tsx` — ajouter section "Mes autres pages" + CTA visiteur + Select multi-cagnottes dans la section Cagnotte.
- `src/components/birthday/FundSelector.tsx` *(nouveau)* — Select des cagnottes du créateur + bouton "Créer".
- `src/components/birthday/MyOtherPagesSection.tsx` *(nouveau)* — carrousel des autres pages du créateur.
- `src/components/VisitorConversionCTA.tsx` *(nouveau)* — bannière sticky + modale incitant à s'inscrire.
- `src/hooks/useAlbumAggregate.ts` *(nouveau)* — appelle la RPC ci-dessus.

### Vérifications
- Préserver la règle "1 page d'anniversaire par an" (contrainte existante).
- RLS : `event_pages` doit autoriser lecture publique si `is_active=true`, écriture au `creator_id` (et au conjoint si `spouse_user_id`).
- Mobile-first : Select cagnottes accessible sans masquer le bouton "Contribuer" sur 757px.

## Hors scope (à confirmer si voulu)
- Notifications cross-pages ("Aminata a créé une nouvelle page mariage").
- Co-administration du conjoint sur la page de mariage (édition à 2).
- Filtrage avancé des cagnottes dans le Select par occasion exacte.
