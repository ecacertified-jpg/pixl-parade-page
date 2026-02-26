

## Inviter ses contacts depuis le cercle d'amis

### Objectif

Ajouter un bouton "Inviter" sur chaque contact du cercle d'amis qui n'a pas encore de compte sur l'app (`linked_user_id` est null). Ce bouton ouvrira le partage natif (WhatsApp, SMS, etc.) avec un message personnalise et un lien d'inscription.

### Modifications

**Fichier : `src/pages/Dashboard.tsx`**

1. **Interface Friend** (ligne 66-73) : ajouter `linked_user_id?: string | null`

2. **loadFriendsFromSupabase** (ligne 209-216) : inclure `linked_user_id` dans le mapping des contacts

3. **Rendu de chaque carte ami** (lignes 712-736) : ajouter un bouton "Inviter" avec l'icone `Send` (lucide) visible uniquement quand `linked_user_id` est null. Ce bouton utilise l'API Web Share (ou fallback copier le lien) pour partager un message personnalise du type :

```text
Salut [nom_contact] ! [prenom_utilisateur] t'invite a rejoindre Joie de Vivre,
l'app qui celebre les moments heureux. Inscris-toi ici : https://joiedevivre-africa.com/go/register
```

4. **Indicateur visuel** : les contacts deja inscrits auront un petit badge vert "Sur l'app" a cote de leur nom

### Logique d'invitation

- Utilise `navigator.share()` si disponible (mobile : WhatsApp, SMS, Telegram en un clic)
- Sinon, copie le lien dans le presse-papier avec un toast de confirmation
- Le lien pointe vers `/go/register` (deep link existant dans le projet)
- Pas besoin d'appeler l'Edge Function `send-invitation` (qui necessite un email) : ici on passe par le partage natif qui est plus adapte aux contacts avec telephone

### Details techniques

- Import de `Send`, `CheckCircle` depuis lucide-react
- Le bouton est petit (icone seule) pour ne pas surcharger la carte
- Un tooltip "Inviter sur l'app" explique l'action
- Aucune modification de base de donnees necessaire
- Aucun nouveau composant : tout est integre dans le rendu existant des cartes ami
