## Objectif
Ajouter un bouton "Ajouter un produit depuis Jumia" dans l'étape 3 ("Qu'est-ce qui te ferait plaisir ?") de l'onboarding, placé juste en-dessous de la bannière "N articles ajoutés à ta liste" et avant la grille des articles, pour permettre à l'utilisateur d'enrichir ses favoris depuis Jumia.

## Modifications

**Fichier : `src/components/OnboardingExperience.tsx`**

1. Importer `JumiaImportModal` depuis `@/components/wishlist/JumiaImportModal` et `ShoppingBag` depuis `lucide-react`.
2. Ajouter un state local `const [showJumiaModal, setShowJumiaModal] = useState(false);`.
3. Dans le bloc de l'étape 3 (autour des lignes 995–1018), insérer un bouton orange (style cohérent avec celui présent dans `WishlistCatalog`) :
   - Placé **après** la bannière "{N} article(s) ajouté(s) à ta liste"
   - Placé **avant** la bannière d'avertissement "Ajoute au moins 3 articles..."
   - Apparence : `Button variant="outline"` plein largeur, bordure et texte orange (`border-orange-400 text-orange-600 hover:bg-orange-50`), icône `ShoppingBag`, label "Ajouter un produit depuis Jumia".
   - `onClick` : ouvre le modal (`setShowJumiaModal(true)`).
4. Monter `<JumiaImportModal isOpen={showJumiaModal} onClose={() => setShowJumiaModal(false)} countryCode={...} />` à la fin du composant (utiliser le countryCode déjà disponible si présent, sinon laisser undefined — le hook gère le cas).
5. Après ajout réussi via le modal, les favoris externes sont stockés dans `external_favorites` (séparé de `user_favorites`). Pour que l'étape ne soit pas bloquée artificiellement si l'utilisateur ajoute uniquement depuis Jumia, on garde le comportement actuel (3 favoris internes requis pour avancer) — le bouton Jumia est complémentaire et permet à l'utilisateur d'enrichir sa wishlist immédiatement.

## Notes techniques
- `JumiaImportModal` existe déjà et gère URL → fetch meta → insertion en DB via `useAddExternalFavorite` (toast de succès inclus).
- Aucun changement de schema DB ni de RLS nécessaire.
- Aucune autre étape de l'onboarding n'est impactée.
