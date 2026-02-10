
# Remplacer les inputs date natifs par le composant BirthdayPicker

## Probleme

Dans `Auth.tsx`, les deux formulaires d'inscription (telephone et email) utilisent un simple `<Input type="date">` pour la date d'anniversaire. Ce champ natif n'est pas ergonomique sur mobile : il n'affiche pas le format attendu (jj/mm/aaaa), ne propose pas de validation en temps reel, et n'a pas le meme style que le reste de l'application.

Le composant `BirthdayPicker` existe deja et gere parfaitement le mobile (saisie manuelle avec pave numerique + selecteur natif via l'icone calendrier). Il est deja utilise dans `CompleteProfileModal`, `ProfileSettings`, `AddFriendModal` et `AddEventModal`.

## Solution

Remplacer les deux `<Input type="date">` par le composant `<BirthdayPicker>` dans les formulaires d'inscription de `Auth.tsx`.

Comme les formulaires utilisent `react-hook-form` avec un champ `birthday` de type `string` (format yyyy-MM-dd), il faut faire le pont entre le `BirthdayPicker` (qui travaille avec des objets `Date`) et le formulaire :
- Convertir la valeur string du formulaire en `Date` pour le `BirthdayPicker`
- Convertir la `Date` retournee en string `yyyy-MM-dd` via `format()` pour le formulaire

## Detail technique

### Fichier modifie : `src/pages/Auth.tsx`

**1. Ajouter l'import du BirthdayPicker** (en haut du fichier) :
```
import { BirthdayPicker } from '@/components/ui/birthday-picker';
```

**2. Formulaire telephone (ligne 1345-1355)** -- Remplacer :
```
<div className="space-y-2">
  <Label htmlFor="birthday">Date d'anniversaire</Label>
  <Input id="birthday" type="date" {...signUpForm.register('birthday')} />
  {signUpForm.formState.errors.birthday && ...}
</div>
```
Par :
```
<BirthdayPicker
  label="Date d'anniversaire"
  labelIcon={<Gift className="h-4 w-4 text-primary" />}
  value={signUpForm.watch('birthday') ? new Date(signUpForm.watch('birthday') + 'T00:00:00') : undefined}
  onChange={(date) => signUpForm.setValue('birthday', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true })}
/>
```

**3. Formulaire email (ligne 1420-1427)** -- Meme remplacement :
```
<div className="space-y-2">
  <Label htmlFor="email-birthday">Date d'anniversaire</Label>
  <Input id="email-birthday" type="date" {...emailSignUpForm.register('birthday')} />
</div>
```
Par :
```
<BirthdayPicker
  label="Date d'anniversaire"
  labelIcon={<Gift className="h-4 w-4 text-primary" />}
  value={emailSignUpForm.watch('birthday') ? new Date(emailSignUpForm.watch('birthday') + 'T00:00:00') : undefined}
  onChange={(date) => emailSignUpForm.setValue('birthday', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true })}
/>
```

**4. Verifier que `format` de date-fns et `Gift` de lucide-react sont deja importes** (ils le sont).

## Resultat attendu

- Sur mobile : champ texte avec placeholder "jj/mm/aaaa", pave numerique, auto-formatage, et bouton calendrier avec selecteur natif
- Sur desktop : meme champ texte + popover calendrier
- Validation en temps reel avec indicateur vert/rouge
- Coherence visuelle avec le `CompleteProfileModal` et les autres formulaires
