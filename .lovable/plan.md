

# Fix : Politique RLS SELECT manquante pour les prestataires sur `business_collective_funds`

## Diagnostic

La table `business_collective_funds` a les politiques RLS suivantes :
- **SELECT** : "Beneficiaries can view business funds created for them" -- verifie `beneficiary_user_id = auth.uid()`
- **INSERT** : "Authenticated users can create business fund links" -- `WITH CHECK (true)`
- **INSERT** : "Business owners can create collective funds" -- verifie propriete du commerce
- **DELETE** : "Business owners can delete their collective funds" -- verifie propriete du commerce

**Il manque une politique SELECT pour les prestataires.** Le prestataire NewTech (`user_id: aae8fedd-...`) possede le business (`id: 6f6556d8-...`), mais aucune politique ne lui permet de lire les lignes ou `business_id` correspond a son commerce. Le backfill a bien insere la ligne, mais elle est invisible pour le prestataire.

De plus, la ligne backfillee a `beneficiary_user_id: NULL`, donc meme la politique SELECT existante pour les beneficiaires ne s'applique pas.

## Correction

### Migration SQL

Ajouter une politique RLS SELECT pour les proprietaires de commerce :

```sql
CREATE POLICY "Business owners can view their collective funds"
ON public.business_collective_funds
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_collective_funds.business_id
    AND ba.user_id = auth.uid()
  )
  OR business_id = auth.uid()
);
```

Cette politique permet au prestataire de voir toutes les lignes `business_collective_funds` dont le `business_id` correspond a un de ses comptes business.

## Resultat attendu

Apres cette migration, le prestataire NewTech verra la cagnotte "Samsung Galaxy A16" sur la page `/business-collective-funds` lorsqu'il clique sur le lien WhatsApp.

## Fichiers modifies

1. **Migration SQL** -- Ajout de la politique RLS SELECT pour les proprietaires de commerce
