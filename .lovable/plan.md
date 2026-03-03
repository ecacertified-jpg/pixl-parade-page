
# Fix : Page vide apres clic sur le lien WhatsApp du prestataire

## Diagnostic

L'analyse approfondie montre que :
- La politique RLS SELECT est correcte et en place
- Les donnees existent dans la table `business_collective_funds`
- Les jointures FK sont non-ambigues
- Aucune politique RESTRICTIVE ne bloque l'acces

Le probleme probable est lie au navigateur integre de WhatsApp : le hook `useBusinessCollectiveFunds` effectue deux requetes sequentielles (business_accounts puis business_collective_funds avec jointures) et un filtre cote client. Dans le navigateur WhatsApp, la session auth peut ne pas etre completement initialisee au moment ou le hook s'execute, ce qui retourne un tableau vide.

## Solution

Creer une page dediee `/business/orders/:fundId` qui charge directement la cagnotte specifique par son `fund_id`, au lieu de rediriger vers la page generique.

### 1. Nouvelle page `BusinessFundOrderView.tsx`

Creer `src/pages/BusinessFundOrderView.tsx` :
- Recupere le `fundId` depuis les parametres de route (`useParams`)
- Charge directement depuis `business_collective_funds` en filtrant par `fund_id`
- Joint `collective_funds`, `products`, et `profiles` (beneficiaire) en une seule requete
- Charge les contributeurs separement
- Affiche la cagnotte avec le composant `CollectiveFundBusinessCard` existant
- Inclut un lien vers la page de gestion complete

Avantages :
- Une seule requete ciblee au lieu de charger toutes les cagnottes
- Pas de filtre cote client (RLS gere tout)
- Plus resilient aux problemes de timing d'authentification
- Meilleure UX : le prestataire voit directement LA cagnotte concernee

### 2. Modification de `App.tsx`

Remplacer le `Navigate` par le nouveau composant :

```text
<Route path="/business/orders/:fundId" element={
  <ProtectedRoute>
    <L><BusinessFundOrderView /></L>
  </ProtectedRoute>
} />
```

Garder le redirect `/business/orders` (sans fundId) vers `/business-collective-funds`.

### 3. Contenu de la page

La page affichera :
- Header avec titre "Commande cagnotte" et bouton retour
- Les details complets de la cagnotte (produit, progression, contributeurs, infos de livraison)
- Un bouton "Voir toutes mes cagnottes" pointant vers `/business-collective-funds`
- Un etat de chargement et un etat d'erreur si la cagnotte n'est pas trouvee

## Fichiers concernes

1. **Nouveau** : `src/pages/BusinessFundOrderView.tsx` -- page dediee pour le lien WhatsApp
2. **Modifie** : `src/App.tsx` -- route mise a jour pour pointer vers le nouveau composant
