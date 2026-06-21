## 1. Modale "Créer une page client" (ClientsManager)

- **Erreur "Failed to send a request to the Edge Function"** : la fonction `create-client-account` n'est pas joignable. Action : redéployer `create-client-account` et `claim-client-account`, vérifier les logs, puis durcir le hook côté client (affichage du vrai message d'erreur edge).
- **Champ date** : remplacer le `<Input type="date">` par `BirthdayPicker` (`src/components/ui/birthday-picker.tsx`) — même UX que l'onboarding "C'est quand ton anniversaire ?" (placeholder `jj/mm/aaaa`, bouton calendrier, helper "Tapez la date ou utilisez le calendrier"). `disableFuture=false` (anniv futur autorisé pour la prochaine célébration).
- **Email optionnel** : retirer la validation bloquante, ajouter `placeholder="ex: kady@email.com"` et un helper text sous le champ "Optionnel — pour lui envoyer le lien aussi par email".

## 2. Erreur chat Assistant IA

- Symptôme : toast "Une erreur est survenue. Veuillez réessayer." après envoi. Hook `useAIChat` appelle l'edge `ai-chat-assistant` en streaming SSE.
- Action : redéployer `ai-chat-assistant`, inspecter les logs (clé `LOVABLE_API_KEY` / `OPENAI_API_KEY` / variable d'env manquante, ou erreur de parsing du body). Corriger la cause racine. Améliorer la remontée d'erreur du hook (afficher `errorData.error` exact dans le toast pour debug futur).

## 3. Page anniversaire / event

### 3a. Bandeaux d'alerte/info (UrgentMessageBanner) — affichage harmonieux

Aujourd'hui : `space-y-2` empile verticalement chaque message ⇒ liste longue avec plusieurs messages.

Refonte :
- **0 message** : rien (déjà OK).
- **1 message** : bandeau pleine largeur tel quel.
- **2+ messages** : carrousel horizontal compact avec snap (`overflow-x-auto snap-x snap-mandatory`), chaque carte fait ~85% de la largeur, indicateurs (dots) sous le carrousel, auto-rotation toutes les 5 s (respect `prefers-reduced-motion`). Hauteur fixe ⇒ pas d'expansion verticale quel que soit le nombre de messages.

### 3b. Suppression sections doublons

Dans `BirthdayPage.tsx` (≈ l.689-705) et `EventPage.tsx` (≈ l.270-280), supprimer entièrement le bloc `<section>✨ Célébrer</section>` qui contient `<CelebrationFeed>` + `<ViralShareBar>`.

Note : `CelebrationFeed` (mur de célébrations / publications) reste accessible ailleurs ? À vérifier. Si oui, on supprime seulement `ViralShareBar` et on garde `CelebrationFeed`. Sinon on supprime tout le bloc comme demandé.

→ **Choix retenu (interprétation littérale du brief)** : supprimer la section "Célébrer" entière (bouton "Publier une célébration" + feed) ET le bloc "Fais rayonner ce moment" (`ViralShareBar`). Le partage reste assuré par le bouton flottant Partage + le bouton Partage sous le bouton Live de la vidéo de couverture.

## 4. Sélecteur indicatif pays — onglets Invités & Équipe

- Créer un composant réutilisable `PhoneInputWithCountry` (input + Select indicatif basé sur `src/config/countries.ts`).
- Indicatif par défaut = pays de l'utilisateur connecté (`profile.country_code` → `phonePrefix`). Fallback `+225`.
- Stocker la valeur normalisée `+XXX XXXXXX` côté DB (rester compatible avec l'existant en concaténant prefix + numéro).
- Intégration :
  - `GuestsList.tsx` (champ "Téléphone (optionnel)")
  - `OrganizersManager.tsx` (champ "Téléphone (WhatsApp)")
  - Bonus cohérence : `ClientsManager.tsx` (même champ).

## 5. Modale Wave — masquer le numéro

Dans `WaveCheckoutModal.tsx` étape `pay`, supprimer le bloc "Envoie à +225..." (lignes 97-104). Conserver "Montant exact" + bouton "Ouvrir Wave" (le lien Wave pré-remplit déjà destinataire et montant) + "J'ai payé". Le numéro reste invisible côté UI.

---

### Fichiers à modifier
- `src/components/organization/ClientsManager.tsx` (BirthdayPicker, email optionnel, phone selector, meilleur message d'erreur)
- `src/components/organization/UrgentMessageBanner.tsx` (carrousel pour 2+)
- `src/pages/BirthdayPage.tsx`, `src/pages/EventPage.tsx` (retirer section Célébrer + ViralShareBar)
- `src/components/organization/GuestsList.tsx`, `src/components/organization/OrganizersManager.tsx` (phone selector)
- `src/features/subscription/WaveCheckoutModal.tsx` (masquer numéro)
- `src/hooks/useAIChat.ts` (toast d'erreur explicite)

### Fichiers à créer
- `src/components/ui/phone-input.tsx` (input + selector indicatif)

### Backend
- Redéployer `create-client-account`, `claim-client-account`, `ai-chat-assistant` et inspecter les logs pour corriger les causes des erreurs.
