

# Corriger la saisie manuelle de date sur mobile - Ameliorations supplementaires

## Constat

Le code dans `birthday-picker.tsx` implemente deja le champ texte unifie avec `inputMode="numeric"` et auto-formatage `jj/mm/aaaa`. Cependant, certains navigateurs mobiles peuvent ignorer `inputMode="numeric"` ou ne pas afficher le bon clavier.

## Ameliorations a appliquer

### Fichier : `src/components/ui/birthday-picker.tsx`

1. **Ajouter `type="text"` explicitement** sur le `<Input>` (ligne 239) pour eviter toute ambiguite avec le navigateur mobile.

2. **Ajouter `pattern="[0-9]*"`** pour forcer le clavier numerique sur iOS (Safari ignore parfois `inputMode` mais respecte `pattern`).

3. **Ajouter `autoComplete="off"`** pour empecher les navigateurs mobiles de proposer un auto-remplissage qui pourrait interferer avec le formatage.

4. **Ajouter `aria-label`** pour l'accessibilite du champ.

### Changement concret (lignes 239-252)

Remplacer les proprietes du `<Input>` par :

```text
<Input
  ref={inputRef}
  type="text"
  placeholder={placeholder}
  value={inputValue}
  onChange={(e) => handleInputChange(e.target.value)}
  inputMode="numeric"
  pattern="[0-9]*"
  autoComplete="off"
  maxLength={10}
  disabled={disabled}
  aria-label={label || "Date d'anniversaire"}
  className={...}
/>
```

### Pourquoi ces ajouts

- `pattern="[0-9]*"` : Sur iOS Safari, c'est le moyen le plus fiable de forcer le pave numerique
- `type="text"` explicite : Certains navigateurs peuvent inferer un type different sans declaration explicite
- `autoComplete="off"` : Empeche les suggestions du navigateur de remplacer la valeur formatee

### Impact

Un seul fichier modifie. Tous les formulaires utilisant `BirthdayPicker` beneficient automatiquement du changement.
