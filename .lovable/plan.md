
# Corriger le profil "Aboutou WhatsApp" et securiser les parametres WhatsApp

## Correction 1 : Donnees en base

Mettre a jour le profil `3fc4a030-46ca-44f7-92d8-eb2d70e1610e` pour supprimer l'espace en trop dans `first_name` (passer de `"Aboutou WhatsApp "` a `"Aboutou WhatsApp"`).

- Outil : requete UPDATE via l'outil d'insertion de donnees

## Correction 2 : Edge Function `notify-contribution-progress`

Ajouter `.trim()` sur tous les parametres textuels passes a `sendWhatsAppTemplate` pour eviter les erreurs Meta `(#100) Invalid parameter` causees par des espaces parasites.

### Lignes concernees

Chaque appel a `sendWhatsAppTemplate` utilise un tableau de 6 parametres :
```
[recipientName, contributorName, beneficiaryName, String(percentage), currentAmountStr, daysRemaining]
```

Les variables `recipientName`, `contributorName` et `beneficiaryName` proviennent de la base et peuvent contenir des espaces en trop.

**Modification** : creer une fonction utilitaire `trimParams` qui applique `.trim()` sur chaque parametre du tableau, et l'utiliser dans les 4 appels `sendWhatsAppTemplate` (lignes 155, 201, 256, 305).

```text
// Ajouter apres la ligne 8
function trimParams(params: string[]): string[] {
  return params.map(p => p.trim());
}

// Remplacer dans les 4 appels :
[recipientName, contributorName, ...] -> trimParams([recipientName, contributorName, ...])
```

Cela protege contre tout espace parasite dans n'importe quel champ de profil, pas seulement "Aboutou WhatsApp".

## Fichiers modifies

- Base de donnees : UPDATE sur `profiles` (correction ponctuelle)
- `supabase/functions/notify-contribution-progress/index.ts` : ajout de `trimParams` + application aux 4 appels WhatsApp
