

# Nettoyage des comptes en doublon par numero de telephone

## Analyse des doublons detectes

6 groupes de profils partagent le meme numero de telephone (13 comptes au total).

### Groupe 1 : +2250707467445 (3 comptes - Votre numero)

| Compte | Prenom | Activite | Primaire ? |
|--------|--------|----------|------------|
| `b8d0d4e4` | Aboutou WhatsApp | 2 contacts, 1 contribution, 6 relations | **OUI** (le plus actif) |
| `aae8fedd` | Amtey Florentin Aboutou | 1 contact, 4 relations | Non - a fusionner |
| `a4132bbc` | Maribelle | 1 relation | Non - a fusionner |

### Groupe 2 : +2250708895257 (Francoise)

| Compte | Prenom | Activite | Primaire ? |
|--------|--------|----------|------------|
| `0b4eb0bb` | Francoise | 9 contacts, 2 contributions, 1 fund, 3 relations | **OUI** |
| `2fbdc7e0` | Eca Certified | 1 contact, 1 contribution, 2 funds, 3 relations | Non - a fusionner |

### Groupe 3 : +2290140158347 (Samuel)

| Compte | Prenom | Activite | Primaire ? |
|--------|--------|----------|------------|
| `c7a72d56` | Samuel | 0 activite | **OUI** (plus ancien : 14h08) |
| `3b8297f4` | Samuel | 0 activite | Non - a fusionner |

### Groupe 4 : +2250707287309 (Honorine)

| Compte | Prenom | Activite | Primaire ? |
|--------|--------|----------|------------|
| `ca469154` | Honrine Koko | 0 activite | **OUI** (plus ancien) |
| `d5d3b39d` | Honorine | 0 activite | Non - a fusionner |

### Groupe 5 : +2250506398601 (Augustin)

| Compte | Prenom | Activite | Primaire ? |
|--------|--------|----------|------------|
| `6c6544e5` | Augustin Kambire | 0 activite | **OUI** (plus ancien) |
| `447fb553` | Augustin | 0 activite | Non - a fusionner |

### Groupe 6 : +2250171349089 (Grace Maria)

| Compte | Prenom | Activite | Primaire ? |
|--------|--------|----------|------------|
| `02275fd7` | Grace Maria | 0 activite | **OUI** (plus ancien) |
| `2f635847` | Grace Maria | 0 activite | Non - a fusionner |

## Plan d'execution

### Etape 1 : Fusionner les 7 comptes secondaires via `merge-user-accounts`

Appeler la Edge Function existante `merge-user-accounts` pour chaque paire :

1. Fusionner `aae8fedd` (Amtey Florentin) -> `b8d0d4e4` (Aboutou WhatsApp)
2. Fusionner `a4132bbc` (Maribelle) -> `b8d0d4e4` (Aboutou WhatsApp)
3. Fusionner `2fbdc7e0` (Eca Certified) -> `0b4eb0bb` (Francoise)
4. Fusionner `3b8297f4` (Samuel) -> `c7a72d56` (Samuel)
5. Fusionner `ca469154` ou `d5d3b39d` (Honorine) - garder le plus ancien
6. Fusionner `447fb553` (Augustin) -> `6c6544e5` (Augustin Kambire)
7. Fusionner `2f635847` (Grace Maria) -> `02275fd7` (Grace Maria)

La fonction `merge-user-accounts` transfere automatiquement : contacts, contributions, cagnottes, relations, posts, et marque le compte secondaire comme fusionne.

### Etape 2 : Verification post-fusion

Requete SQL pour confirmer qu'il n'y a plus de doublons de telephone dans `profiles`.

## Risques et precautions

- La fonction `merge-user-accounts` est deja testee et utilisee par le dashboard admin
- Les donnees (contributions, cagnottes, contacts) seront transferees au compte primaire
- Les comptes secondaires seront marques comme fusionnes, pas supprimes physiquement
- Aucune modification de schema necessaire

## Impact

- 7 comptes secondaires fusionnes dans leurs comptes primaires respectifs
- Elimination des notifications WhatsApp en double causees par les telephones partages
- Votre compte "Aboutou WhatsApp" (`b8d0d4e4`) recevra les donnees de vos 2 autres comptes

