

## Plan : Rendre la sélection d'onglet visible sur le dashboard

### Probleme
L'onglet actif n'est pas visuellement distinguable car le fond `bg-muted` de la TabsList et le style actif se confondent sur le theme violet de l'app. Sur mobile, seules les icones sont affichees, ce qui aggrave le probleme.

### Solution

**Fichier : `src/pages/Dashboard.tsx`** (lignes 602-662)

Ajouter des classes specifiques aux `TabsTrigger` du dashboard pour un contraste fort :
- Onglet actif : fond `bg-primary text-white` avec une bordure inferieure coloree et un shadow
- Onglet inactif : fond transparent, texte `text-muted-foreground`
- Afficher le texte du label sur mobile aussi (retirer `hidden sm:inline`) pour ameliorer la lisibilite

Concretement, remplacer les classes des `TabsTrigger` par :
```
className="flex flex-col sm:flex-row gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-2
  data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md
  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
```

Et afficher les labels en permanence (retirer `hidden` de `<span>`), en utilisant `text-[10px]` sur mobile pour que ca tienne dans la grille a 5 colonnes.

**Fichier : `src/components/ui/tabs.tsx`**

Pas de modification globale pour eviter d'impacter les autres usages. Les overrides seront faits localement dans Dashboard.tsx.

### Resultat attendu
- L'onglet selectionne aura un fond violet vif (`primary`) avec texte blanc
- Les onglets inactifs seront clairement differents (fond transparent)
- Le label texte sera visible meme sur mobile

