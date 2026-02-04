
# Plan de Correction : Affichage du Logo sur BusinessPreview

## Probleme Identifie

Sur la page `BusinessPreview.tsx` (page de previsualisation d'une boutique), le logo "Joie de Vivre" n'apparait pas a deux endroits :

1. **Header** : Utilise une icone `<Gift>` au lieu du logo
2. **Footer** : Utilise aussi une icone `<Gift>` au lieu du logo

La page `ProductPreview.tsx` affiche correctement le logo car elle importe et utilise `logo-jdv-rose.png`.

## Solution

Modifier `BusinessPreview.tsx` pour utiliser le meme pattern que `ProductPreview.tsx` :

### Changements a effectuer

| Emplacement | Avant | Apres |
|-------------|-------|-------|
| Import | (aucun import de logo) | `import logoRose from "@/assets/logo-jdv-rose.png";` |
| Header (ligne 184-188) | `<Gift className="h-6 w-6 text-primary" />` | `<img src={logoRose} alt="Joie de Vivre" className="h-8 w-auto" />` |
| Footer (ligne 265) | `<Gift className="h-5 w-5 inline-block mr-2 text-primary" />` | `<img src={logoRose} alt="" className="h-6 w-auto" />` |

### Code Modifie

**1. Ajouter l'import du logo** (apres la ligne 2) :
```tsx
import logoRose from "@/assets/logo-jdv-rose.png";
```

**2. Modifier le header** (lignes 184-189) :
```tsx
<Link to="/" className="flex items-center gap-2">
  <img src={logoRose} alt="Joie de Vivre" className="h-8 w-auto" />
  <span className="font-poppins font-semibold text-lg text-primary">
    JOIE DE VIVRE
  </span>
</Link>
```

**3. Modifier le footer** (lignes 264-267) :
```tsx
<div className="text-center mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
  <img src={logoRose} alt="" className="h-6 w-auto" />
  <span>La plateforme de cadeaux collaboratifs</span>
</div>
```

## Details Techniques

- **Fichier modifie** : `src/pages/BusinessPreview.tsx`
- **Logo utilise** : `src/assets/logo-jdv-rose.png` (deja existant dans le projet)
- **Aucun nouveau fichier** : Le logo rose existe deja et correspond exactement a celui uploade

## Resultat Attendu

| Element | Avant | Apres |
|---------|-------|-------|
| Header | Icone Gift violet | Logo rose "Joie de Vivre" + texte |
| Footer | Icone Gift + texte | Logo rose + texte |

## Impact

- Coherence visuelle avec `ProductPreview.tsx`
- Branding unifie sur les pages publiques de previsualisation
- Aucun impact sur d'autres fonctionnalites
