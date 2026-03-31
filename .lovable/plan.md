

# Plan : Corriger l'affichage du nom sur la page d'anniversaire

## Probleme

La page d'anniversaire affiche "Ami(e)" au lieu du vrai prenom. Cause :

1. `BirthdayPage.tsx` ligne 91 : `const firstName = birthdayPerson.first_name || 'Ami(e)'`
2. Le `first_name` est charge depuis `profiles` (ligne 169-173), mais cette requete peut echouer (RLS, profil incomplet, privacy_setting)
3. Le champ `title` de `birthday_pages` contient deja le nom (ex: "Anniversaire de Francoise") mais n'est jamais utilise comme fallback

## Solution

Ajouter un fallback qui extrait le prenom depuis le `title` de la page si le profil ne retourne pas de `first_name`.

### Modification dans `src/pages/BirthdayPage.tsx`

Ligne 91 — remplacer :
```typescript
const firstName = birthdayPerson.first_name || 'Ami(e)';
```

Par :
```typescript
const firstName = useMemo(() => {
  if (birthdayPerson.first_name) return birthdayPerson.first_name;
  // Extraire le prénom du titre "Anniversaire de Prénom"
  if (page?.title) {
    const match = page.title.match(/Anniversaire de (.+)/i);
    if (match && match[1] && match[1] !== "mon ami(e)") return match[1];
  }
  return 'Ami(e)';
}, [birthdayPerson.first_name, page?.title]);
```

Cela garantit que meme si la requete `profiles` echoue ou retourne un `first_name` vide, le nom est extrait du `title` stocke dans `birthday_pages` lors de la creation.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/pages/BirthdayPage.tsx` | Ajouter fallback via extraction du nom depuis `page.title` |

