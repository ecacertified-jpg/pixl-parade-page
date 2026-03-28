

# Plan : Page anniversaire virale et partageable

## Concept

Chaque anniversaire d'un utilisateur devient une **page publique partageable** (ex: `joiedevivre-africa.com/birthday/sarah-2026`) ou les invites peuvent :
- Ecrire un message d'anniversaire
- Ajouter une photo souvenir
- Participer au cadeau collectif (cagnotte liee)

Chaque participant doit creer un compte pour contribuer, creant une **boucle virale naturelle**.

## Architecture

```text
/birthday/:token  (page publique)
       │
       ├── Header festif (prenom, age, emoji occasion)
       ├── Section Messages (lecture publique, ecriture = auth)
       ├── Section Photos (galerie, ajout = auth)
       ├── Section Cagnotte (barre progression, contribuer = auth)
       └── Bouton Partager (WhatsApp, Facebook, etc.)
```

## Modifications

### 1. Migration SQL — Table `birthday_pages`

Nouvelle table pour stocker les pages d'anniversaire virales :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK profiles.user_id — la personne fetee |
| slug | text | URL unique (ex: `sarah-2026`) |
| celebration_year | integer | Annee |
| title | text | "Anniversaire de Sarah" |
| cover_image_url | text | Image de couverture optionnelle |
| fund_id | uuid | FK collective_funds (cagnotte liee, optionnel) |
| is_active | boolean | Page visible |
| created_at | timestamp | |

Table `birthday_page_photos` pour les photos partagees par les invites :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| birthday_page_id | uuid | FK birthday_pages |
| uploader_id | uuid | FK auth.users |
| uploader_name | text | Nom affiche |
| image_url | text | URL dans Supabase Storage |
| caption | text | Legende optionnelle |
| created_at | timestamp | |

RLS : lecture publique, ecriture = authenticated. La table `birthday_wishes_messages` existante est reutilisee pour les messages (ajout d'une colonne `birthday_page_id`).

### 2. Nouvelle page `src/pages/BirthdayPage.tsx`

Page publique accessible sans authentification a `/birthday/:slug`. Sections :

- **Header festif** : confettis legers, prenom, age, emoji, message d'accueil
- **Messages** : liste des messages depuis `birthday_wishes_messages` filtres par `birthday_page_id`. Formulaire d'ajout (requiert auth, sinon bouton "Creer un compte pour ecrire")
- **Photos** : galerie en grille depuis `birthday_page_photos`. Upload (requiert auth)
- **Cagnotte** : si `fund_id` existe, affiche barre de progression + bouton "Participer au cadeau" (redirige vers `/f/:fundId` ou ouvre le modal de contribution si auth)
- **Partage** : bouton flottant pour partager la page via WhatsApp, Facebook, SMS, copier le lien

### 3. Route dans `App.tsx`

```typescript
<Route path="/birthday/:slug" element={<L><BirthdayPage /></L>} />
```

Placee dans les routes publiques (pas de ProtectedRoute).

### 4. Generation automatique de la page

Modification de la Edge Function `birthday-wishes` : quand une celebration d'anniversaire est creee (jour J), generer automatiquement une entree dans `birthday_pages` avec un slug base sur le prenom + annee (ex: `sarah-2026`). Si doublon, ajouter un suffixe aleatoire.

### 5. Composant de partage de la page

Nouveau composant `BirthdayPageShareButton.tsx` qui utilise le pattern existant de `ShareMenu.tsx` avec un message pre-formate :

> "🎉 Anniversaire de Sarah 🎂 — Ecris-lui un message, ajoute une photo ou participe au cadeau collectif ! joiedevivre-africa.com/birthday/sarah-2026"

### 6. Lien depuis le dashboard

Dans `SmartNotificationsSection.tsx`, quand une notification `birthday_wish_ai` est cliquee, en plus du modal de celebration, afficher un bouton "Partager ma page d'anniversaire" qui copie/partage le lien de la page virale.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx_birthday_pages.sql` | Nouveau — tables + RLS |
| `src/pages/BirthdayPage.tsx` | Nouveau — page publique virale |
| `src/components/BirthdayPageShareButton.tsx` | Nouveau — bouton partage |
| `src/App.tsx` | Ajout route `/birthday/:slug` |
| `supabase/functions/birthday-wishes/index.ts` | Generer la page auto au jour J |
| `src/components/BirthdayCelebrationModal.tsx` | Ajouter bouton "Partager ma page" |
| `src/integrations/supabase/types.ts` | Regenere apres migration |

## Boucle virale

```text
Sarah reçoit sa page → Partage sur WhatsApp
    → Amis cliquent le lien → Voient la page festive
        → "Ecrire un message" → Redirigé vers /auth
            → Crée un compte → Ecrit son message
                → Découvre JDV → Crée sa propre page pour son anniversaire
```

