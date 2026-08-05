# Entrée directe dans sa page d'anniversaire après inscription

## Constat actuel

La publication automatique existe déjà, mais **seulement** dans un cas particulier : lorsque l'URL contient `intent=express_birthday` ou un `claim=<token>` (liens envoyés par un organisateur, ou CTA visiteur). Dans ce cas `runExpressPostSignup` crée la page d'anniversaire de l'année en cours, la marque publiée (`published_at`, `is_active`) et redirige vers `/birthday/:slug?welcome=1`.

Pour une inscription normale depuis `/auth` (Google ou code de vérification WhatsApp/SMS), rien de tout cela ne se déclenche : l'utilisateur atterrit sur `/dashboard?onboarding=true` et doit publier sa page manuellement via l'onboarding.

Deuxième problème : même quand l'intention express est présente, la connexion Google la perd. Le `redirectTo` de l'OAuth est `${origin}/auth` sans paramètres, donc au retour de Google les paramètres `intent`/`claim` ont disparu de l'URL.

## Ce qui va être fait

1. **Publication automatique pour toute nouvelle inscription**
   Chaque nouvel inscrit (Google, code WhatsApp/SMS, e-mail) obtient automatiquement sa page d'anniversaire créée et publiée, puis est envoyé directement dessus (`/birthday/:slug?welcome=1`) au lieu du tableau de bord.
   Les connexions d'utilisateurs existants ne changent pas : elles conservent la redirection actuelle.

2. **Conservation de l'intention à travers Google**
   L'intention (`intent`, `claim`) est mémorisée avant la redirection vers Google et relue au retour, pour que le parcours express fonctionne aussi en OAuth.

3. **Détection du nouvel inscrit après Google**
   Au retour de Google, on distingue un premier passage d'une simple reconnexion (comparaison de la date de création du compte) afin de ne déclencher la publication que pour les nouveaux comptes.

4. **Pas de double onboarding**
   Le drapeau existant `express_birthday_<userId>` continue d'empêcher l'ouverture de la modale d'onboarding bloquante ; l'utilisateur voit sa page publiée, les étapes complémentaires restant accessibles à tout moment.

5. **Filet de sécurité**
   Si la création de page échoue (collision de slug, réseau), l'utilisateur est redirigé vers le tableau de bord comme aujourd'hui, sans blocage ni erreur visible.

## Détails techniques

- `src/utils/expressSignup.ts` : ajout d'une persistance de l'intention (`sessionStorage`/`localStorage`) et d'un mode « auto » déclenché sans paramètre d'URL. La logique de création reste inchangée (page `birthday_pages` de l'année en cours, `is_active: true`, `published_at`, drapeaux locaux `bp_type_*` et `express_birthday_*`).
- `src/utils/authRedirect.ts` : dans `resolvePostAuthPath`, si `opts.isNewUser` est vrai et qu'aucune destination explicite (`returnTo`, `returnUrl`, `redirect`) n'est présente, exécution du flux express et retour de `/birthday/:slug?welcome=1`, avec repli `/dashboard`. Les redirections explicites gardent la priorité.
- `src/pages/Auth.tsx` :
  - `signInWithGoogle` mémorise l'intention avant `signInWithOAuth`.
  - Le `useEffect` de redirection post-auth détecte un nouveau compte (via `user.created_at`) et passe `{ isNewUser: true }` à `resolvePostAuthPath`.
  - Les chemins OTP WhatsApp/SMS et e-mail passent déjà `isNewUser: true` : aucun changement nécessaire.
- Aucune modification de base de données ni de fonction edge.

## Hors périmètre

- Modifier le contenu ou le design de la page d'anniversaire.
- Changer les étapes de l'onboarding complémentaire (souhaits, amis, cagnotte, partages).