

# Plan : Notifications d'anniversaire imminent + Célébration au jour J

## Résumé

Envoyer des notifications WhatsApp/in-app/Push à J-7, J-5, J-3, J-1 pour informer l'utilisateur ou le contact de l'imminence de son anniversaire. Au jour J, déclencher une célébration complète dans le Dashboard : confettis, vidéo plein écran, messages des proches, remerciements automatiques et messages personnalisés.

---

## Partie 1 : Template WhatsApp — Guide de création dans Meta

### Nouveau template : `joiedevivre_birthday_countdown`

**Créer dans Meta Business Manager > WhatsApp > Gestionnaire de modèles :**

- **Nom** : `joiedevivre_birthday_countdown`
- **Catégorie** : MARKETING
- **Langue** : Français

**Header** : Texte — `Joie de Vivre 🎂`

**Body** :
```
Salut {{1}}, ton anniversaire arrive dans {{2}} jour(s) ! 🎉

Tes amis sur Joie de Vivre préparent peut-être une surprise pour toi. Assure-toi que ta liste de souhaits est à jour pour maximiser tes chances de recevoir le cadeau parfait !
```

**Paramètres** :
- `{{1}}` = Prénom (ex: `Aminata`)
- `{{2}}` = Nombre de jours (ex: `7`)

**Bouton CTA** :
- Type : URL
- Texte : `Mettre à jour ma wishlist`
- URL : `https://joiedevivre-africa.com/wishlist`

**Exemple pour soumission** :
- `{{1}}` : `Aminata`
- `{{2}}` : `7`
- URL exemple : `https://joiedevivre-africa.com/wishlist`

---

## Partie 2 : Edge Function — Notifications J-7/J-5/J-3/J-1 au birthday person

### Modifier `supabase/functions/birthday-wishes/index.ts`

Actuellement, `birthday-wishes` ne traite que le jour J. Enrichir pour aussi gérer le compte à rebours :

**Logique ajoutée :**
1. Parcourir tous les `profiles` et `contacts` avec birthday
2. Calculer les jours restants
3. Pour J-7, J-5, J-3, J-1 :
   - **In-app** : Insérer dans `scheduled_notifications` avec `notification_type: 'birthday_countdown'`
   - **Push** : Envoyer via `push_subscriptions` (utilisateurs) ou notifier le propriétaire du contact
   - **WhatsApp** : Envoyer `joiedevivre_birthday_countdown` au numéro de l'utilisateur/contact
4. Déduplication via `birthday_contact_alerts` (alert_type = `birthday_countdown`, days_before = X)

**Pour les contacts non-utilisateurs** : le WhatsApp leur est envoyé directement (incitation à rejoindre JDV), et une notification in-app est aussi envoyée au propriétaire du contact pour l'informer.

### Ajouter dans `useWhatsAppTemplateInventory.ts`
Nouvelle entrée pour `joiedevivre_birthday_countdown`.

---

## Partie 3 : Célébration au jour J dans le Dashboard

### 3a. Migration SQL — Table `birthday_wishes_messages`

```sql
CREATE TABLE birthday_wishes_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_user_id UUID NOT NULL,        -- l'anniversaire de qui
  sender_id UUID REFERENCES auth.users(id),
  sender_name TEXT,
  message_text TEXT NOT NULL,
  is_from_fund BOOLEAN DEFAULT false,
  fund_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Avec RLS : le birthday_user_id peut lire, les authenticated peuvent insérer.

### 3b. Nouveau composant : `BirthdayCelebrationModal.tsx`

Modal plein écran mobile déclenché quand `notification_type = 'birthday_wish_ai'` est détecté au jour J :

**Étape 1 — Confettis + Message puissant**
- Confettis (canvas-confetti) lancés immédiatement
- Message personnalisé puissant avec le prénom, l'âge, un texte inspirant
- Animation d'entrée spectaculaire (scale + fade)

**Étape 2 — Vidéo plein écran**
- Vidéo depuis le bucket `assets` (ex: `birthday-celebration-generic.mp4`)
- Lecture automatique (autoPlay, muted initialement, puis unmute)
- Modal fullscreen (`fixed inset-0 z-50 bg-black`)
- Bouton fermer en overlay

**Étape 3 — Messages des proches**
- Requêter `birthday_wishes_messages` et `gratitude_wall` (type `birthday`)
- Afficher les messages avec avatar, nom, texte
- Scroll horizontal ou vertical avec animations staggered

**Étape 4 — Remerciements automatiques**
- Dès que la vidéo commence à jouer (`onPlay`), déclencher l'envoi automatique de remerciements :
  - Appeler une Edge Function `send-birthday-thanks` qui :
    - Récupère tous ceux qui ont écrit un message (`birthday_wishes_messages`)
    - Récupère tous ceux qui ont contribué à une cagnotte (`fund_contributions` liée à l'utilisateur)
    - Envoie une notification in-app + Push à chacun : "Merci pour ton message/ta contribution !"
  - Marquer les remerciements comme envoyés (éviter les doublons)

**Étape 5 — Messages personnalisés**
- Permettre au birthday person de rédiger un message de remerciement personnalisé
- Textarea + bouton "Envoyer à tous" ou sélection individuelle
- Insertion dans `gratitude_wall` avec type `birthday_thanks`

### 3c. Edge Function : `send-birthday-thanks/index.ts`

- Récupère messages + contributions pour l'anniversaire
- Envoie notifications in-app + Push aux contributeurs/messagers
- Déduplication par journée

### 3d. Intégration dans le Dashboard

- Dans `SmartNotificationsSection.tsx`, quand `birthday_wish_ai` est détecté, ouvrir automatiquement `BirthdayCelebrationModal`
- Le modal remplace le `BirthdayNotificationCard` actuel pour le jour J

---

## Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| Migration SQL (`birthday_wishes_messages` + RLS) | Créer |
| `supabase/functions/birthday-wishes/index.ts` | Modifier (ajouter countdown J-7/5/3/1) |
| `supabase/functions/send-birthday-thanks/index.ts` | Créer |
| `src/components/BirthdayCelebrationModal.tsx` | Créer |
| `src/components/BirthdayCountdownCard.tsx` | Créer (notification in-app pour countdown) |
| `src/components/SmartNotificationsSection.tsx` | Modifier (intégrer modal + countdown card) |
| `src/hooks/useWhatsAppTemplateInventory.ts` | Modifier (ajouter template) |
| `.lovable/memory/features/birthday-celebration-flow.md` | Créer |

