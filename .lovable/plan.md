
# Correction du 404 sur le lien de partage admin

## Diagnostic

Le lien `https://joiedevivre-africa.com/join/ADM-AXE9` affiche une page 404. La route `/join/:code` existe bien dans le code React (`App.tsx` ligne 221), mais le probleme vient de l'une de ces deux causes :

1. **Le site n'a pas ete republie** depuis l'ajout de la route `/join/:code` -- il faut publier la derniere version pour que cette route soit disponible en production.

2. **Configuration SPA manquante** -- Les applications React avec React Router necessitent que le serveur redirige toutes les routes vers `index.html`. Sans cela, un acces direct a `/join/ADM-AXE9` renvoie un 404 serveur car le fichier n'existe pas physiquement.

## Solution

### Etape 1 : Ajouter un fichier de configuration pour le routage SPA

Creer un fichier `public/_redirects` (pour Netlify/Lovable) qui redirige toutes les routes vers `index.html` :

```
/*    /index.html   200
```

Cela garantit que toute URL comme `/join/ADM-AXE9` charge l'application React, qui prend ensuite en charge le routage cote client.

### Etape 2 : Republier le site

Apres cette modification, il faudra **publier** le site pour que les changements soient effectifs sur `joiedevivre-africa.com`.

## Note technique

Cette correction beneficiera aussi a toutes les autres routes de l'application (deep links vers `/go/funds`, etc.) qui pourraient egalement renvoyer un 404 en acces direct sur le domaine de production.
