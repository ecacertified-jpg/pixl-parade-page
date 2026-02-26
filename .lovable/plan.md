

## Correction du decalage d'un jour dans le compte a rebours des anniversaires

### Probleme identifie

Le calcul du nombre de jours avant un anniversaire est decale d'un jour dans plusieurs fichiers. La cause principale est double :

1. **Parsing UTC des dates** : `new Date("2025-03-02")` est interprete comme minuit UTC, et `getMonth()`/`getDate()` utilisent le fuseau local, ce qui peut decaler la date d'un jour
2. **`today` non normalise** : `new Date()` inclut l'heure actuelle (ex: 14h), ce qui fausse le calcul avec `Math.ceil`

### Solution

Creer une **fonction utilitaire centralisee** dans `src/lib/utils.ts` et l'utiliser partout :

```typescript
export function getDaysUntilBirthday(birthdayStr: string | Date | null | undefined): number {
  if (!birthdayStr) return 0;
  
  // Parser la date en evitant le piege UTC
  let month: number, day: number;
  if (typeof birthdayStr === 'string') {
    const parts = birthdayStr.split('-');
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    month = birthdayStr.getMonth();
    day = birthdayStr.getDate();
  }
  
  // Normaliser aujourd'hui a minuit local
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let nextBirthday = new Date(today.getFullYear(), month, day);
  nextBirthday.setHours(0, 0, 0, 0);
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  return Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
```

Les corrections cles :
- Parser les strings "YYYY-MM-DD" manuellement via `split('-')` pour eviter le piege UTC
- Normaliser `today` a minuit (`setHours(0,0,0,0)`)
- Utiliser `Math.round` au lieu de `Math.ceil` (les deux dates etant a minuit, le resultat est un entier)

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/lib/utils.ts` | Ajouter la fonction `getDaysUntilBirthday` |
| `src/pages/Dashboard.tsx` (ligne 471-488) | Remplacer la fonction locale par un import de `utils.ts` |
| `src/hooks/useUpcomingBirthdays.ts` (ligne 39-57) | Utiliser le parsing manuel et normaliser `today` a minuit |
| `src/components/BirthdayCountdownCard.tsx` (ligne 28-30) | Parser la date manuellement au lieu de `new Date(birthday)` |
| `src/components/CollectiveFundCard.tsx` (ligne 69-91) | Remplacer par import de la fonction utilitaire |
| `src/components/PublicFundsCarousel.tsx` (ligne 14-43) | Remplacer par import de la fonction utilitaire |
| `src/components/funds/PublicFundCard.tsx` (ligne 16-39) | Remplacer par import de la fonction utilitaire |
| `src/components/CollaborativeGiftModal.tsx` (ligne 178-180) | Corriger le meme bug |

### Impact
- **8 fichiers** modifies (1 nouveau utilitaire + 7 corrections)
- Aucun changement de schema de base de donnees
- Le compte a rebours sera desormais exact partout dans l'application
- Les Edge Functions backend (Deno) ne sont pas affectees car elles tournent en UTC cote serveur

