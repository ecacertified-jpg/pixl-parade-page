

# Fix : Nettoyage du prefixe Meta avec espace

## Probleme

L'URL generee par Meta contient un espace apres le placeholder : `{{1}} efacddcb-...`. La regex actuelle supprime `{{1}}` mais ne gere pas l'espace qui suit, produisant ` efacddcb-...` (avec espace) qui n'est pas un UUID valide.

## Solution

Modifier `cleanMetaParam.ts` pour aussi supprimer les espaces apres le prefixe Meta :

```typescript
return param.replace(/^\{\{\d+\}\}\s*/, '').trim();
```

Le `.trim()` supplementaire gere aussi d'eventuels espaces en fin de chaine (encodage URL).

## Fichier concerne

`src/utils/cleanMetaParam.ts` -- une seule ligne a modifier.

## Configuration Meta CTA (rappel)

- **Base URL** : `https://joiedevivre-africa.com/business/orders/`
- **Suffixe dynamique** : `{{1}}`
- **Exemple** : `https://joiedevivre-africa.com/business/orders/efacddcb-3b07-4652-9c45-123297b48a64`

