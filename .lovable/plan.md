
# Corriger "Veuillez respecter le format requis" dans les modals Ajout d'ami et Ajout d'evenement

## Cause

Le meme probleme que celui corrige dans `Auth.tsx` : le composant `BirthdayPicker` utilise `pattern="[0-9]*"` sur son input (pour forcer le pave numerique mobile), mais la valeur formatee contient des barres obliques (ex: "19/07/1976"). La validation HTML5 native du navigateur bloque la soumission du formulaire.

La correction `noValidate` a ete appliquee dans `Auth.tsx` mais pas dans les deux autres formulaires qui utilisent `BirthdayPicker` dans une balise `<form>`.

## Solution

Ajouter `noValidate` sur les balises `<form>` des deux modals concernes.

## Fichiers impactes

### 1. `src/components/AddFriendModal.tsx` (ligne 85)

Changer :
```
<form onSubmit={handleSubmit} className="space-y-4">
```
En :
```
<form onSubmit={handleSubmit} className="space-y-4" noValidate>
```

### 2. `src/components/AddEventModal.tsx` (ligne 101)

Changer :
```
<form onSubmit={handleSubmit} className="space-y-4">
```
En :
```
<form onSubmit={handleSubmit} className="space-y-4" noValidate>
```

Les autres composants utilisant `BirthdayPicker` (`CompleteProfileModal` et `ProfileSettings`) n'utilisent pas de balise `<form>` et ne sont donc pas concernes.
