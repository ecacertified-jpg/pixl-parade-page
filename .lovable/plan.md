
# Differencier visuellement les pages Auth Client et BusinessAuth

## Probleme

Les deux pages d'authentification (`/auth` et `/business-auth`) sont maintenant quasiment identiques :
- Meme titre "Joie de Vivre"
- Meme sous-titre "Connectez-vous ou creez un compte pour commencer"
- Meme lien "Espace Business" avec la meme icone Store

L'utilisateur ne peut pas savoir sur quelle page il se trouve.

## Cause

Lors de l'alignement de BusinessAuth sur Auth, le bouton de navigation dans BusinessAuth a garde le texte "Espace Business" au lieu de pointer vers l'espace client. Il devrait dire "Espace Client" pour indiquer qu'il redirige vers la page client.

## Solution

Modifier `src/pages/BusinessAuth.tsx` pour differencier clairement la page Business :

### 1. Changer le lien de navigation (BusinessAuth.tsx)
- Texte : "Espace Business" -> **"Espace Client"**
- Icone : `Store` -> **`ArrowLeft`** (deja importe dans le fichier)
- Cela indique clairement que ce bouton ramene vers la page client

### 2. Ajouter un indicateur visuel "Espace Business" (BusinessAuth.tsx)
- Ajouter un petit badge ou sous-titre sous "Joie de Vivre" indiquant **"Espace Business"** avec l'icone Store
- Cela permet de savoir immediatement qu'on est sur la page Business

### Resultat attendu

**Page Auth (client)** :
```text
Joie de Vivre
Connectez-vous ou creez un compte...
[Store] Espace Business   <-- lien vers /business-auth
```

**Page BusinessAuth** :
```text
Joie de Vivre
[Store] Espace Business    <-- badge indicateur
Connectez-vous ou creez un compte...
[ArrowLeft] Espace Client  <-- lien vers /auth
```

### Fichier modifie
- `src/pages/BusinessAuth.tsx` uniquement
