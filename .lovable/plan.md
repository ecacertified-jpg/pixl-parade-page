
# Plan : Pré-remplir la date d'anniversaire + fermer le calendrier au clic

## Problème 1 — Date d'anniversaire non pré-remplie depuis l'inscription

La date saisie dans le formulaire d'inscription (Auth) est stockée dans `profiles.birthday`. L'onboarding charge déjà cette valeur (ligne 117-118 de `OnboardingExperience.tsx`). Cela fonctionne donc déjà si le profil a été correctement créé lors de l'inscription. Cependant, il peut y avoir un délai entre le `signUp` et la création du profil par le trigger `handle_new_user`. On va s'assurer que la date est aussi récupérée depuis `user.user_metadata.birthday` en fallback.

### Solution

**Fichier : `src/components/OnboardingExperience.tsx`**

Dans le `useEffect` qui charge le profil (lignes 110-125), ajouter un fallback : si `data?.birthday` est vide, vérifier `user.user_metadata?.birthday`. Si présent, l'utiliser pour initialiser `birthday`.

## Problème 2 — Le calendrier reste ouvert après sélection d'un jour

Actuellement, `onSelect={setBirthday}` met à jour la date mais le `Popover` reste ouvert. L'utilisateur doit fermer manuellement pour voir le résultat et le bouton "Suivant".

### Solution

**Fichier : `src/components/OnboardingExperience.tsx`**

Remplacer le `Popover` non contrôlé par un `Popover` contrôlé avec un état `calendarOpen`. Quand l'utilisateur sélectionne un jour (`onSelect`), mettre à jour `birthday` ET fermer le popover (`setCalendarOpen(false)`).

```typescript
const [calendarOpen, setCalendarOpen] = useState(false);

<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
  ...
  <Calendar
    onSelect={(date) => {
      setBirthday(date);
      if (date) setCalendarOpen(false);
    }}
    ...
  />
</Popover>
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter fallback `user_metadata.birthday`, contrôler le Popover du calendrier |
