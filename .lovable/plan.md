

# Templates WhatsApp : Rappel anniversaire aux amis + Célébration vidéo jour J

## Contexte

Le système utilise déjà `joiedevivre_birthday_reminder` (2 paramètres : nom du contact, jours restants) pour rappeler aux utilisateurs l'anniversaire d'un proche. Il manque :
1. Un template pour **notifier les amis du cercle** de l'anniversaire imminent d'un contact commun (avec CTA vers cagnotte)
2. Un template de **célébration avec vidéo** envoyé directement à l'utilisateur le jour de son anniversaire

## Template 1 : `joiedevivre_birthday_friend_alert`

**But** : Alerter les amis d'un bénéficiaire que son anniversaire approche, avec un lien vers la cagnotte.

**Catégorie Meta** : `UTILITY`

**Structure** :
- **Header** : Image (logo festif ou photo du bénéficiaire)
- **Body** (4 paramètres) :
  ```
  🎂 L'anniversaire de {{1}} est dans {{2}} jour(s) !

  {{3}} a créé une cagnotte pour lui offrir un cadeau mémorable. Rejoignez-nous pour contribuer !

  💰 Objectif : {{4}} FCFA
  ```
  - `{{1}}` = Prénom du bénéficiaire
  - `{{2}}` = Nombre de jours restants
  - `{{3}}` = Prénom de l'organisateur
  - `{{4}}` = Montant objectif
- **Bouton CTA** : `Contribuer` → URL `https://joiedevivre-africa.com/f/{{1}}` (suffixe = fund_id)
- **Footer** : `Joie de Vivre - Cadeaux collaboratifs`

## Template 2 : `joiedevivre_birthday_celebration`

**But** : Envoyer une vidéo de célébration à l'utilisateur le jour de son anniversaire.

**Catégorie Meta** : `UTILITY` (notification transactionnelle liée au compte)

**Structure** :
- **Header** : **Vidéo** (URL dynamique vers une vidéo de célébration personnalisée ou générique)
- **Body** (2 paramètres) :
  ```
  🎉🎂 Joyeux anniversaire {{1}} !

  Toute l'équipe Joie de Vivre te souhaite une journée exceptionnelle remplie de bonheur et d'amour ! {{2}}
  ```
  - `{{1}}` = Prénom de l'utilisateur
  - `{{2}}` = Message personnalisé (ex: "25 ans, bienvenue dans le quart de siècle !" ou message générique)
- **Bouton CTA** : `Voir mes surprises` → URL `https://joiedevivre-africa.com/dashboard/{{1}}` (suffixe = onglet ou vide)
- **Footer** : `Joie de Vivre - Célébrons ensemble`

## Modifications code

### 1. `supabase/functions/_shared/sms-sender.ts`

Ajouter le support du **header vidéo** dans `sendWhatsAppTemplate` :
- Nouveau paramètre optionnel `headerVideoUrl?: string`
- Si fourni, ajouter un composant header de type `video` au lieu de `image`

### 2. `supabase/functions/birthday-wishes/index.ts`

Après la création de la notification in-app, ajouter l'envoi du template `joiedevivre_birthday_celebration` avec :
- Le prénom de l'utilisateur
- Le message personnalisé (déjà généré par `getBirthdayMessagesByAge`)
- L'URL de la vidéo de célébration (stockée en config ou générée)

### 3. `supabase/functions/birthday-reminder-with-suggestions/index.ts`

Ajouter un envoi du template `joiedevivre_birthday_friend_alert` aux amis du cercle du bénéficiaire (quand une cagnotte existe pour cet anniversaire).

## Configuration dans Meta Business Manager

### Étapes pour créer chaque template :

1. **Aller dans** : Meta Business Suite → WhatsApp Manager → Gestionnaire de comptes → Modèles de messages
2. **Cliquer** : "Créer un modèle"

### Template `joiedevivre_birthday_friend_alert` :

| Champ | Valeur |
|-------|--------|
| Nom du modèle | `joiedevivre_birthday_friend_alert` |
| Catégorie | Utilitaire |
| Langue | Français |
| En-tête | Image (échantillon : image festive) |
| Corps | Le texte ci-dessus avec `{{1}}` à `{{4}}` |
| Bouton | Appel à l'action → Visiter le site → Texte: "Contribuer" → URL type: Dynamique → Base: `https://joiedevivre-africa.com/f/` → Exemple suffixe: `abc123` |
| Pied de page | `Joie de Vivre - Cadeaux collaboratifs` |

### Template `joiedevivre_birthday_celebration` :

| Champ | Valeur |
|-------|--------|
| Nom du modèle | `joiedevivre_birthday_celebration` |
| Catégorie | Utilitaire |
| Langue | Français |
| En-tête | **Vidéo** (échantillon : vidéo MP4 de célébration, max 16 Mo) |
| Corps | Le texte ci-dessus avec `{{1}}` et `{{2}}` |
| Bouton | Appel à l'action → Visiter le site → Texte: "Voir mes surprises" → URL type: Dynamique → Base: `https://joiedevivre-africa.com/dashboard/` → Exemple suffixe: `birthday` |
| Pied de page | `Joie de Vivre - Célébrons ensemble` |

### Contraintes vidéo Meta :
- **Format** : MP4 uniquement
- **Taille max** : 16 Mo
- **Durée recommandée** : < 30 secondes
- **Résolution** : 720p minimum
- **L'URL doit être publiquement accessible** (hébergée sur Supabase Storage ou CDN)

### Après soumission :
- Attendre l'approbation Meta (quelques minutes à 24h)
- Vérifier le statut dans WhatsApp Manager → Modèles → Filtrer par "En attente"
- Tester avec `test-whatsapp-send` une fois approuvé

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/_shared/sms-sender.ts` | Ajouter support `headerVideoUrl` |
| `supabase/functions/birthday-wishes/index.ts` | Envoyer `joiedevivre_birthday_celebration` avec vidéo au jour J |
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Envoyer `joiedevivre_birthday_friend_alert` aux amis avec lien cagnotte |
| `.lovable/memory/whatsapp-messaging-strategy.md` | Documenter les 2 nouveaux templates |

