

# Plan : Corriger le timeout de connexion Admin + vérifier le flux Client/Business

## Problème identifié

Sur la page `/admin-auth`, un **timer de 8 secondes** déclenche l'erreur "Délai dépassé" pendant la connexion. Le problème est une **course entre deux flux** :

1. `onSubmit` fait `signInWithPassword` → puis vérifie `admin_users` → puis `navigate('/admin')` — tout en gardant `isLoading=true`
2. En parallèle, le `useEffect([user])` détecte le nouveau `user` et lance `checkAdminStatus` qui refait la même requête `admin_users`

Avec une latence réseau élevée (Afrique), ces requêtes séquentielles dépassent facilement 8 secondes.

## Corrections

### 1. `src/pages/AdminAuth.tsx` — Éliminer la course et augmenter le timeout

- **Augmenter le timeout** de 8s à 15s pour accommoder les connexions lentes
- **Empêcher le double-check** : dans `onSubmit`, après un login réussi et la vérification admin faite, naviguer directement sans attendre le `useEffect`. Le `useEffect([user])` ne doit vérifier que si l'utilisateur arrive déjà connecté (pas après un login via formulaire)
- Ajouter un flag `isSubmitting` ref pour que le `useEffect` ne fasse pas de check concurrent pendant que `onSubmit` est en cours

### 2. Vérifier le flux Client (`Auth.tsx`)

Le flux client est déjà correct — il utilise `onAuthStateChange` pour la redirection et ne fait pas de double requête. Pas de changement nécessaire.

### 3. Vérifier le flux Business (`BusinessAuth.tsx`)

Vérifier qu'il suit le même pattern résilient que `Auth.tsx`. Pas de changement attendu si c'est le cas.

## Résumé des changements

| Fichier | Modification |
|---------|-------------|
| `src/pages/AdminAuth.tsx` | Timeout 8s→15s, flag `isSubmitting` ref pour éviter le double-check dans useEffect, `finally` nettoyage propre |

