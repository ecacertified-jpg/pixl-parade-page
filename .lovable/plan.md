

# Inferer le pays depuis la ville/adresse de livraison

## Probleme

Le trigger `handle_new_user()` detecte le pays uniquement via le prefixe telephonique. Quand un utilisateur s'inscrit par email (sans telephone), le pays tombe par defaut sur `'CI'` (Cote d'Ivoire), meme si sa ville indique clairement un autre pays.

Exemple concret : Paul (senoupaul4@gmail.com) habite a "Kowegbo, Akpakpa, Cotonou" (Benin) mais est affiche comme etant en Cote d'Ivoire.

## Solution

Ajouter une detection par ville/adresse comme second niveau de fallback dans le trigger, en s'inspirant de la fonction `inferCountryFromAddress` deja utilisee cote frontend.

## Modifications

### 1. Migration SQL : Mettre a jour `handle_new_user()`

Logique actuelle :
```text
phone -> prefixe +229 = BJ, +221 = SN, +225 = CI
sinon -> CI (defaut)
```

Nouvelle logique :
```text
1. phone -> prefixe +229 = BJ, +221 = SN, +225 = CI, +228 = TG, +223 = ML, +226 = BF
2. SI resultat = 'CI' ET pas de telephone -> verifier la ville (city) dans les metadata
3. city contient 'cotonou', 'porto-novo', 'parakou', 'bohicon', 'abomey' -> BJ
4. city contient 'dakar', 'thies', 'kaolack', 'saint-louis' -> SN
5. city contient 'lome', 'kara', 'sokode' -> TG
6. city contient 'bamako', 'sikasso', 'mopti' -> ML
7. city contient 'ouagadougou', 'bobo-dioulasso' -> BF
8. Sinon -> CI (defaut)
```

### 2. Migration SQL : Corriger le profil de Paul

```text
UPDATE profiles SET country_code = 'BJ'
WHERE user_id = '9bdeafea-3ad4-4369-8afd-a28e3e1243ab';
```

### 3. Migration SQL : Backfill general

Corriger tous les profils existants qui ont `country_code = 'CI'`, pas de telephone, et une ville identifiable dans un autre pays :

```text
UPDATE profiles SET country_code = 'BJ'
WHERE country_code = 'CI' AND phone IS NULL
AND (city ILIKE '%cotonou%' OR city ILIKE '%porto-novo%' OR city ILIKE '%parakou%' ...);
```

Meme logique pour SN, TG, ML, BF.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/migrations/[new].sql` | Creer : nouveau trigger + corrections de donnees |

Aucune modification frontend necessaire -- la detection se fait au niveau de la base de donnees lors de la creation du compte.

