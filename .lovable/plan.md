

# Ajouter des icones aux etapes de progression sur mobile

## Probleme

Actuellement, les etapes de progression utilisent uniquement un cercle gris (non complete) ou un Check vert (complete). Sur mobile, les labels textuels seuls ne sont pas assez visuels et distinctifs.

## Solution

Remplacer le cercle gris par une **icone specifique** pour chaque etape quand elle n'est pas encore completee. Quand l'etape est completee, l'icone Check verte est conservee.

### Mapping des icones par etape

| Etape | Icone Lucide |
|-------|-------------|
| Identite | `User` |
| Anniversaire | `Gift` |
| Business | `Store` |
| Email | `Mail` |
| Localisation | `MapPin` |
| Contact / Telephone | `Phone` |
| Mot de passe | `Lock` |
| Validation | `CheckCircle` |

### Comportement

- **Etape non completee** : icone specifique en `text-muted-foreground/50` (grisee)
- **Etape completee** : icone `Check` en `text-green-500` (comme actuellement)

## Fichiers impactes

### 1. `src/pages/Auth.tsx`

- **`ClientSignupProgressIndicator`** (ligne 36) : modifier le type `steps` pour inclure une icone, et afficher l'icone au lieu du cercle gris
- **`PhoneSignupProgress`** (ligne 82) : ajouter les icones `User`, `Gift`, `MapPin`, `Phone` aux etapes
- **`EmailSignupProgress`** (ligne 100) : ajouter les icones `User`, `Gift`, `Mail`, `Lock` aux etapes
- Ajouter les imports : `User`, `Gift`, `MapPin`, `Phone`, `Lock` depuis lucide-react

### 2. `src/pages/BusinessAuth.tsx`

- **`ProgressIndicator`** (ligne 34) : refactorer pour accepter des etapes avec icones (comme `ClientSignupProgressIndicator`)
- **`SignupProgressIndicator`** (ligne 72) : passer les icones `User`, `Store`, `Phone`, `CheckCircle`
- **`EmailSignupProgressIndicator`** (ligne 98) : ajouter les icones `User`, `Store`, `Mail`, `Lock`, `CheckCircle` aux etapes
- Ajouter les imports : `User`, `Gift`, `MapPin`, `Lock`, `CheckCircle` depuis lucide-react

### 3. `src/components/CompleteProfileModal.tsx`

- Modifier l'indicateur inline (ligne 135) pour utiliser les icones `Gift`, `MapPin`, `Phone`
- Appliquer le meme layout responsive (`grid grid-cols-3`, `flex-col items-center`)
- Ajouter les imports : `MapPin`, `Phone` depuis lucide-react

## Detail technique

Le type des etapes evolue de :
```text
{ label: string; isComplete: boolean }
```
vers :
```text
{ label: string; isComplete: boolean; icon: LucideIcon }
```

Le rendu de chaque etape devient :
```text
{step.isComplete
  ? <Check className="h-4 w-4 text-green-500" />
  : <step.icon className="h-4 w-4 text-muted-foreground/50" />}
<span>{step.label}</span>
```

Les icones passent de `h-3 w-3` a `h-4 w-4` pour une meilleure lisibilite sur mobile.

