

# Mise a jour des mentions legales avec les informations reelles

## Modifications

Mise a jour du fichier `src/config/countries.ts` pour l'entite CI avec les informations fournies, et du fichier `src/config/appVersion.ts` pour l'adresse.

## Changements

### 1. `src/config/countries.ts` - Entite legale CI (ligne 50-60)

| Champ | Avant | Apres |
|-------|-------|-------|
| legalForm | `SARL` | `SARLU` |
| registrationNumber | `CI-ABJ-2024-B-XXXXX` | `CI-ABJ-03-2026-B13-00031` |
| address | `Abidjan, Côte d'Ivoire` | `Abidjan, Anyama, Carrefour du Lycée Moderne d'Anyama, non loin du Grand Séminaire d'Anyama, Lot 174 ; Ilot 21` |
| email | `contact@joiedevivre.ci` | `contact@joiedevivre-africa.com` |
| phone | `+225 07 XX XX XX XX` | `+225 05 46 56 66 46` |
| legalForm description | `Société à Responsabilité Limitée` | `Société à Responsabilité Limitée Unipersonnelle` |

### 2. `src/config/appVersion.ts` - COMPANY_INFO

Mise a jour de l'adresse complete et de l'email pour coherence.

### 3. `src/pages/LegalNotice.tsx` - Ligne 85

Mise a jour de la condition d'affichage pour gerer `SARLU` en plus de `SARL`.

## Details techniques

- Le champ `legalForm` passe de `SARL` a `SARLU`, donc la condition dans `LegalNotice.tsx` (ligne 85) qui affiche le libelle complet doit etre adaptee pour reconnaitre `SARLU`
- Les autres pays conservent leurs valeurs placeholder (`XXXXX`) car seul le CI a des informations reelles pour le moment

