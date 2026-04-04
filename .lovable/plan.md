

# Plan : Accélérer la soumission du formulaire d'ami

## Diagnostic

La lenteur vient de deux facteurs :

1. **Cold start de l'Edge Function** : la première invocation après inactivité prend 2-5s pour démarrer le runtime Deno
2. **4 requêtes DB séquentielles** : token lookup → profile check → contact insert → token update, chacune ajoutant ~100-200ms de latence réseau

## Optimisations

### 1. Paralléliser les requêtes DB dans l'Edge Function

Regrouper le token lookup et le profile check en un `Promise.all`, puis le contact insert et le token update en un second `Promise.all`.

```text
Avant (séquentiel) :  Token → Profile → Insert → Update  (~800ms DB)
Après (parallèle) :  [Token + Profile] → [Insert + Update]  (~400ms DB)
```

### 2. Feedback instantané côté client

Afficher l'écran de succès (confettis) **immédiatement** après l'appel, sans attendre la fin de l'animation de chargement. Actuellement le bouton reste en "Envoi en cours..." pendant toute la durée de la requête. On peut :
- Passer en mode "optimistic" : afficher le succès dès que la requête part, et gérer l'erreur en rollback
- Ou mieux : lancer les confettis **dès réception de la réponse** sans délai supplémentaire (c'est déjà le cas, mais le cold start reste le goulot)

### 3. Pré-chauffer l'Edge Function au chargement de la page

Au `useEffect` initial (quand le token est validé côté client), envoyer un appel OPTIONS/ping léger pour "réveiller" la fonction avant que l'utilisateur ne soumette.

## Modifications

### `supabase/functions/save-friend-form/index.ts`

- Paralléliser token lookup + profile check avec `Promise.all`
- Paralléliser contact insert + token update avec `Promise.all`

### `src/pages/FillFriendForm.tsx`

- Ajouter un appel de pré-chauffe (warm-up) dans le `useEffect` de chargement du token : un simple `supabase.functions.invoke("save-friend-form", { body: {} })` qui retournera une erreur 400 mais réveillera la fonction
- Cela se fait en parallèle du chargement du formulaire, invisible pour l'utilisateur

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/functions/save-friend-form/index.ts` | Paralléliser les requêtes DB |
| `src/pages/FillFriendForm.tsx` | Ajouter warm-up de l'Edge Function au chargement |

