

# Repositionner le badge de relation sur la ligne du prenom

## Probleme actuel

Dans les cartes de contacts du "Mon cercle d'amis", le badge de relation (ex: "Famille", "Ami", "Collegue") est place dans la zone des boutons d'action a droite, ce qui encombre la ligne d'icones et cree un affichage peu harmonieux sur mobile.

## Solution

Deplacer le `Badge` de relation sur la meme ligne que le prenom du contact, aligne a l'extreme droite de cette ligne. Cela libere de l'espace dans la zone des boutons d'action et ameliore la lisibilite.

```text
Avant :
+--------------------------------------------------+
| Bilal                                             |
| Ebimpe, Cocody, Abidjan                           |
| Anniv. dans 349 jours    [Famille] [icones...]    |
+--------------------------------------------------+

Apres :
+--------------------------------------------------+
| Bilal                              Famille        |
| Ebimpe, Cocody, Abidjan                           |
| Anniv. dans 349 jours         [icones...]         |
+--------------------------------------------------+
```

## Modification technique

**Fichier** : `src/pages/Dashboard.tsx`

Dans le bloc de rendu de chaque carte contact (lignes 885-975) :

1. **Ligne du prenom (ligne 888)** : transformer le `div` contenant le nom en `flex` avec `justify-between` et y ajouter le `Badge` de relation a droite.

2. **Zone des boutons (ligne 917-920)** : retirer le `Badge` de relation qui s'y trouve actuellement.

Concretement :

- Ligne 888 : remplacer le div du nom par :
```tsx
<div className="flex items-center justify-between w-full">
  <div className="font-medium flex items-center gap-1.5">
    {friend.name}
    {/* badge "Sur l'app" existant */}
  </div>
  <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0.5">
    {friend.relation}
  </Badge>
</div>
```

- Lignes 918-920 : supprimer le `Badge` qui etait dans la zone des boutons d'action.

Cela ne touche aucune autre logique (liaison, invitation, suppression). Seul l'emplacement visuel du badge change.

