

# Plan : Connecter l'invitation onboarding au cercle d'amis

## Problème

Quand un invité clique sur le lien d'invitation (`/auth?invited=true&ref=INVITATION_ID`) et s'inscrit, rien ne se passe côté inviteur : aucun contact n'est créé dans sa table `contacts`, aucune relation dans `contact_relationships`. L'invitation reste en statut "pending" indéfiniment.

Le flux "Ajouter un ami" (modal) fonctionne car il utilise un formulaire dédié (`save-friend-form`) qui insère directement dans `contacts`.

## Solution

Créer une Edge Function `accept-invitation` qui est appelée après l'inscription de l'invité pour :
1. Valider le token d'invitation
2. Marquer l'invitation comme "accepted"
3. Créer un contact bidirectionnel (inviteur ↔ invité)
4. Déclencher la liaison automatique via `contact_relationships`

### 1. Edge Function `accept-invitation`

Nouveau fichier `supabase/functions/accept-invitation/index.ts` :
- Reçoit `invitation_id` du nouvel utilisateur authentifié
- Vérifie que l'invitation existe et est en statut "pending"
- Met à jour l'invitation : `status = 'accepted'`, `accepted_at = now()`
- Récupère le profil de l'invité (nom, téléphone, anniversaire)
- Insère un contact dans `contacts` pour l'inviteur avec les infos de l'invité
- Insère un contact dans `contacts` pour l'invité avec les infos de l'inviteur
- Les triggers existants (`trg_auto_link_contact`) créeront automatiquement la relation dans `contact_relationships`

### 2. Appeler `accept-invitation` après inscription

Dans la page `/auth` (fichier `src/pages/Auth.tsx` ou composant d'authentification) :
- Détecter les paramètres `invited=true&ref=INVITATION_ID` dans l'URL
- Après inscription réussie, appeler `supabase.functions.invoke('accept-invitation', { body: { invitation_id } })`
- Afficher un toast de succès ("Vous êtes maintenant connecté avec [inviteur] !")

### 3. Migration SQL

Aucune nouvelle table nécessaire. Vérifier que la politique RLS sur `contacts` permet l'insertion par l'Edge Function (via service role key, donc pas de souci RLS).

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/functions/accept-invitation/index.ts` | Créer — logique d'acceptation |
| `src/pages/Auth.tsx` ou composant auth | Appeler accept-invitation après inscription |

