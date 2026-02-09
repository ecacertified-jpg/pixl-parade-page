

# Corriger la saisie manuelle de date d'anniversaire sur mobile

## Probleme

Le composant `BirthdayPicker` utilise toujours un `<input type="date">` sur mobile (ligne 238-256), ce qui empeche la saisie manuelle au format `jj/mm/aaaa`. Les modifications prevues precedemment n'ont pas ete appliquees.

## Solution

Remplacer le bloc conditionnel mobile/desktop (lignes 238-305) par un rendu unifie :

### Fichier : `src/components/ui/birthday-picker.tsx`

Remplacer le bloc `{isMobile ? (...) : (...)}` par :

1. **Un champ texte unique** pour mobile ET desktop : `<Input>` avec `placeholder="jj/mm/aaaa"`, `inputMode="numeric"`, utilisant `handleInputChange` pour l'auto-formatage.

2. **Le bouton calendrier conditionnel** :
   - **Sur mobile** : un `<div>` relatif contenant un `<Button>` visible avec l'icone calendrier, et un `<input type="date">` invisible (`opacity-0, absolute, inset-0`) par-dessus pour ouvrir le selecteur natif du telephone.
   - **Sur desktop** : le `<Popover>` existant avec le composant `<Calendar>`.

### Structure du rendu unifie

```text
<div className="flex gap-2">
  <Input                          <-- champ texte jj/mm/aaaa (mobile + desktop)
    placeholder="jj/mm/aaaa"
    inputMode="numeric"
    value={inputValue}
    onChange={handleInputChange}
  />
  {isMobile ? (
    <div className="relative shrink-0">
      <Button>                    <-- bouton calendrier visible
        <CalendarIcon />
      </Button>
      <input type="date"          <-- input natif cache par-dessus
        className="absolute inset-0 opacity-0"
        onChange={handleNativeDateChange}
      />
    </div>
  ) : (
    <Popover>                     <-- popover calendrier desktop (inchange)
      ...
    </Popover>
  )}
</div>
```

### Attribut `inputMode="numeric"`

Cet attribut est essentiel : il force l'affichage du clavier numerique sur mobile, facilitant la saisie des chiffres de la date.

### Impact

Modification d'un seul fichier. Tous les formulaires utilisant `BirthdayPicker` beneficient automatiquement du changement.

