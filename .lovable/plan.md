

# Plan : Corriger le partage WhatsApp dans le modal de partage d'anniversaire

## Probleme

Le `ShareBirthdayToCirclesModal` ouvre WhatsApp avec le numero brut du contact (ex: `0707467445`). WhatsApp ne reconnait pas ce numero car il manque l'indicatif pays (`+225`). L'erreur affichee est "Impossible de chercher le numero de telephone 0707467445, car il manque l'indicatif pays ou le numero est errone."

De plus, si plusieurs contacts sont selectionnes, seul le premier est cible. L'utilisateur souhaite un partage generique (WhatsApp sans destinataire precis) quand plusieurs contacts sont selectionnes.

## Solution

### Fichier : `src/components/ShareBirthdayToCirclesModal.tsx`

1. **Normaliser le numero de telephone** : quand un seul contact est selectionne et qu'il a un numero, ajouter automatiquement le prefixe pays de l'utilisateur connecte si le numero ne commence pas deja par `+`
   - Importer `useCountry` depuis `@/contexts/CountryContext`
   - Logique : si le numero commence par `0`, le remplacer par le prefixe pays (ex: `0707...` → `+2250707...`)
   - Si le numero commence deja par `+`, le garder tel quel

2. **Gerer la selection multiple** : si plusieurs contacts sont selectionnes, ouvrir WhatsApp en mode generique (`wa.me/?text=...`) sans numero specifique, pour que l'utilisateur choisisse le destinataire dans WhatsApp

### Logique de normalisation

```text
function normalizeForWhatsApp(phone, countryPrefix):
  cleaned = phone.replace(/[^0-9+]/g, '')
  if cleaned.startsWith('+'):
    return cleaned.replace('+', '')  // wa.me attend sans le +
  if cleaned.startsWith('00'):
    return cleaned.slice(2)
  // Numero national : ajouter le prefixe pays
  prefix = countryPrefix.replace('+', '')  // ex: "225"
  if cleaned.startsWith('0'):
    return prefix + cleaned  // +225 + 0707... = 2250707...
  return prefix + cleaned
```

### Comportement final

```text
1 contact selectionne avec tel → wa.me/2250707467445?text=...
Plusieurs contacts selectionnes → wa.me/?text=... (generique)
0 contacts selectionnes         → wa.me/?text=... (generique)
```

