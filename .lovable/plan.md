
# Plan : Masquer les champs Téléphone par défaut

## Probleme

Actuellement, `authInputMethod` est initialisé à `'phone'`, ce qui affiche immédiatement tous les champs du formulaire Téléphone. L'utilisateur veut que les champs ne se dévoilent qu'après avoir cliqué sur le bouton "Téléphone" (même comportement que pour "Email").

## Solution

### Fichier : `src/pages/Auth.tsx`

1. Changer le type de `authInputMethod` pour accepter `null` : `useState<'phone' | 'email' | null>(null)`
2. Initialiser à `null` au lieu de `'phone'`
3. Les deux boutons (Email / Téléphone) restent visibles, mais aucun formulaire ne s'affiche tant que l'utilisateur n'a pas cliqué sur l'un des deux
4. Le rendu conditionnel existant (`authInputMethod === 'phone' ? ... : ...`) devient un triple check : `null` → rien, `'phone'` → formulaire téléphone, `'email'` → formulaire email

### Comportement final

```text
Etat initial :
  [Google]
  --- ou ---
  [Email]  [Téléphone]    ← les deux en variant="outline"
  (aucun champ affiché)

Clic sur "Téléphone" :
  [Email]  [Téléphone ✓]  ← Téléphone en variant="default"
  → Les champs se dévoilent (Prénom, Anniversaire, Localisation, Téléphone)

Clic sur "Email" :
  [Email ✓]  [Téléphone]  ← Email en variant="default"
  → Les champs Email se dévoilent
```
