
# Afficher les noms des contributeurs a la cagnotte

## Probleme identifie

La cagnotte "Samsung Galaxy A16 pour Marie Belle" a 2 contributions en base de donnees (Aboutou WhatsApp: 17 600 XOF et Francoise: 17 600 XOF), mais l'interface affiche "Contributeurs (0)".

La cause : la requete PostgREST imbrique `profiles:contributor_id(first_name, last_name)` dans `fund_contributions(...)`, mais la FK `fund_contributions_contributor_id_fkey` pointe vers 3 relations (profiles, public_profiles, user_birthday_stats), ce qui peut causer une ambiguite silencieuse. De plus, les politiques RLS sur `fund_contributions` pourraient interferer avec le sous-select imbrique.

## Solution

Separer la recuperation des contributions du query principal et les charger en parallele dans une seconde vague.

### Fichier 1 : `src/hooks/useCollectiveFunds.ts`

1. **Retirer `fund_contributions(...)` du select principal** : ne plus imbriquer les contributions dans la requete `collective_funds`. Cela elimine l'ambiguite PostgREST.

2. **Ajouter une requete separee pour les contributions** : dans la vague parallele existante (avec productsResult), ajouter une requete directe :
   ```
   supabase.from('fund_contributions')
     .select('id, fund_id, amount, contributor_id, is_anonymous')
     .in('fund_id', fundIds)
   ```

3. **Recuperer les profils des contributeurs** : apres avoir les contributions, charger les profils via :
   ```
   supabase.from('profiles')
     .select('user_id, first_name, last_name')
     .in('user_id', contributorIds)
   ```

4. **Reconstruire les contributors** en croisant contributions + profils, avec fallback "Utilisateur" si le profil n'est pas accessible.

5. **Adapter la detection `hasContributed`** (pour le calcul de priorite) pour utiliser les contributions separees au lieu de `fund.fund_contributions`.

### Fichier 2 : `src/components/CollectiveFundCard.tsx`

1. **Afficher nom + montant** pour chaque contributeur dans la liste textuelle :
   - Format : "Francoise: 17 600F, Aboutou: 17 600F"
   - Pour les contributeurs au-dela de 2 : "et 3 autres"

2. **Afficher la liste complete expandable** quand il y a plus de 3 contributeurs, avec nom et montant pour chacun.

## Flux de donnees apres modification

```text
Requete 1 (principale) : collective_funds + contacts + orders + business_funds
Requete 2 (parallele)  : contact_relationships (amis)
                        
Vague 2 (parallele) :
  - products (pour images/noms)
  - fund_contributions (NOUVEAU - requete directe)
  - friend contacts (pour priorite)

Vague 3 (sequentielle) :
  - profiles des contributeurs (NOUVEAU)

Assemblage final : fusion contributions + profils dans l'objet CollectiveFund
```

## Fichiers modifies

- `src/hooks/useCollectiveFunds.ts` : requete contributions separee + chargement profils
- `src/components/CollectiveFundCard.tsx` : afficher noms + montants des contributeurs
