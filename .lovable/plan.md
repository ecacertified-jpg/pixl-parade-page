

## Ajouter un indicateur visuel du pays detecte sur les pages Auth

### Contexte

Actuellement, le selecteur de pays dans les formulaires telephone des pages Auth et BusinessAuth affiche uniquement le drapeau + prefixe (ex: "CI +225"). L'utilisateur ne voit pas clairement le nom du pays detecte. L'objectif est d'ajouter un petit indicateur textuel sous le champ telephone.

### Solution

Creer un composant `CountryDetectedIndicator` qui affiche le drapeau + nom du pays en fonction du prefixe selectionne, et l'inserer sous chaque champ telephone dans Auth.tsx et BusinessAuth.tsx.

### Composant a creer

**Fichier : `src/components/auth/CountryDetectedIndicator.tsx`**

Un composant leger qui :
- Recoit le prefixe telephonique (ex: `+225`)
- Convertit en code pays via `getCountryCodeByPhonePrefix`
- Affiche un badge discret avec le drapeau et le nom du pays (ex: "CI Cote d'Ivoire")
- Inclut une icone MapPin pour le contexte visuel
- Style subtil (texte muted, petite taille) pour ne pas surcharger le formulaire

### Fichiers modifies

**1. `src/components/auth/CountryDetectedIndicator.tsx`** (nouveau)
- Composant affichant : icone MapPin + drapeau + nom du pays
- Props : `phonePrefix: string`
- Utilise `getCountryCodeByPhonePrefix` et `getCountryConfig` de `@/config/countries`

**2. `src/pages/Auth.tsx`** (4 insertions)
- Import du composant `CountryDetectedIndicator`
- Insertion apres le champ telephone du formulaire de connexion (apres ligne 1265)
- Insertion apres le champ telephone du formulaire d'inscription (apres ligne 1440)

**3. `src/pages/BusinessAuth.tsx`** (4 insertions)
- Import du composant `CountryDetectedIndicator`
- Insertion apres le champ telephone du formulaire de connexion Business
- Insertion apres le champ telephone du formulaire d'inscription Business

### Rendu visuel attendu

Sous le champ telephone, un texte discret :
```
[MapPin] CI Cote d'Ivoire
```
qui se met a jour dynamiquement quand l'utilisateur change le selecteur de pays.

