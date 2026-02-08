

# Reordonner les methodes d'authentification : Google > Email > Telephone

## Situation actuelle

L'ordre actuel sur la page Auth est :
1. Selecteur Phone / Email (boutons toggle)
2. Formulaire selon la methode selectionnee
3. Separateur "ou"
4. Bouton Google (en bas)

## Nouvel ordre souhaite

1. **Google** (bouton en haut, le plus visible)
2. Separateur "ou"
3. **Selecteur Email / Telephone** (Email selectionne par defaut)
4. Formulaire selon la methode selectionnee

## Modifications

### Fichier : `src/pages/Auth.tsx`

**Changement 1** : Modifier la valeur par defaut de `authInputMethod` de `'phone'` a `'email'` (ligne 99)

**Changement 2** : Restructurer le rendu dans les deux onglets (connexion et inscription) pour placer :
- Le bouton Google **en premier**
- Le separateur "ou" **apres**
- Le selecteur Email / Telephone **ensuite**
- Le formulaire correspondant **en dernier**

L'ordre des boutons du selecteur sera aussi inverse : Email en premier, Telephone en second.

### Structure resultante

```text
+----------------------------------+
|  [Connexion]  [Inscription]      |
+----------------------------------+
|  [Continuer avec Google]         |
+----------------------------------+
|          --- ou ---              |
+----------------------------------+
|  [Email]  [Telephone]            |
+----------------------------------+
|  Formulaire selon la methode     |
+----------------------------------+
```

### Fichiers concernes

- `src/pages/Auth.tsx` : reordonner les elements UI et changer le defaut a `'email'`

