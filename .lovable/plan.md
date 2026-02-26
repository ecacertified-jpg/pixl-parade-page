

## Correction du decalage d'un jour dans le compte a rebours des anniversaires

### Probleme identifie

Le bug a **deux causes** qui se combinent :

1. **A la sauvegarde** : `birthday.toISOString().split('T')[0]` convertit en UTC. Si l'utilisateur est en UTC+1 (France), choisir le 2 mars a minuit local donne le 1er mars 23h en UTC, donc la date stockee est "03-01" au lieu de "03-02". **La base de donnees confirme : l'anniversaire de Meera est stocke comme le 1er mars au lieu du 2 mars.**

2. **A la lecture** : `new Date("2023-03-01")` cree une date en UTC midnight. Les methodes `.getMonth()` et `.getDate()` utilisent le fuseau local, ce qui peut decaler la date dans l'autre sens.

### Solution

**A. Corriger la sauvegarde** (2 fichiers) - formater la date en local au lieu d'utiliser `toISOString()` :

```typescript
// Avant (bug) :
birthday: newFriend.birthday.toISOString().split('T')[0]

// Apres (corrige) :
const d = newFriend.birthday;
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, '0');
const dd = String(d.getDate()).padStart(2, '0');
birthday: `${yyyy}-${mm}-${dd}`
```

Fichiers concernes :
- `src/pages/Dashboard.tsx` (ligne 302)
- `src/components/FriendsCircleReminderCard.tsx` (ligne 118)

**B. Corriger la lecture** (2 fichiers) - eviter `new Date()` sur les strings de date :

| Fichier | Correction |
|---------|-----------|
| `src/pages/Dashboard.tsx` (ligne 215) | Garder `contact.birthday` comme string au lieu de `new Date(contact.birthday)`. Modifier l'interface `Friend` pour accepter `birthday: string` |
| `src/components/SmartBirthdayReminders.tsx` (ligne 91-92) | Utiliser `getDaysUntilBirthday()` au lieu de `new Date(contact.birthday)` |

**C. Corriger le BirthdayPicker mobile** (1 fichier) :

Dans `src/components/ui/birthday-picker.tsx` (ligne 103), `new Date(dateString)` parse "YYYY-MM-DD" en UTC. Corriger avec un parsing local :

```typescript
// Avant :
const parsedDate = new Date(dateString);

// Apres :
const [y, m, d] = dateString.split('-').map(Number);
const parsedDate = new Date(y, m - 1, d);
```

### Fichiers modifies

| Fichier | Type de correction |
|---------|-------------------|
| `src/pages/Dashboard.tsx` | Sauvegarde (ligne 302) + Lecture (ligne 215) + Interface Friend |
| `src/components/FriendsCircleReminderCard.tsx` | Sauvegarde (ligne 118) |
| `src/components/SmartBirthdayReminders.tsx` | Lecture (lignes 91-98) |
| `src/components/ui/birthday-picker.tsx` | Parsing mobile (ligne 103) |

### Impact
- 4 fichiers modifies
- Corrige le decalage a la fois a l'ecriture et a la lecture
- Les contacts deja sauvegardes avec une date decalee devront etre corriges manuellement dans la base
- Aucun changement de schema

