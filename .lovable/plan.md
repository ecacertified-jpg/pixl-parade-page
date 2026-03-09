

## Plan : Refonte du style des onglets du dashboard

### Diagnostic
Les overrides CSS successifs ne fonctionnent pas car les styles de base du composant `TabsTrigger` dans `tabs.tsx` appliquent `data-[state=active]:bg-primary` et `shadow-md` qui entrent en conflit. Meme avec `!important`, le rendu reste trop subtil sur le fond violet clair du dashboard.

### Nouvelle approche : design "underline tabs"
Abandonner le style "fond colore" et passer a un style "barre indicatrice" qui fonctionne quel que soit le theme :

**Fichier 1 : `src/pages/Dashboard.tsx`** (lignes 602-662)

- `TabsList` : fond `bg-white/80 dark:bg-gray-900/80` avec `backdrop-blur`, bordure inferieure grise
- Chaque `TabsTrigger` : 
  - Actif : texte `!text-primary !font-bold`, bordure inferieure epaisse violette (`!border-b-[3px] !border-primary`), fond transparent, pas de shadow
  - Inactif : texte gris, pas de bordure, fond transparent
- Retirer tous les `!bg-[hsl(...)]`, `!shadow-lg`, `!border-white` precedents
- Ajouter `rounded-none` pour un look "flat tabs"

Resultat : l'onglet actif sera clairement identifie par une barre violette epaisse en bas et un texte violet gras, sur un fond blanc neutre. Contraste garanti.

### Fichier impacte
- `src/pages/Dashboard.tsx`

