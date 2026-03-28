

# Plan : Fiabiliser l'invitation d'amis dans l'onboarding

## Problème

La fonction `handleInvite` (ligne 134) appelle `supabase.functions.invoke('send-invitation')` mais ne vérifie pas le champ `error` de la réponse. `supabase.functions.invoke` ne lève **jamais** d'exception en cas d'erreur serveur — il retourne `{ data, error }`. Le compteur `invitedCount` est donc incrémenté même si l'invitation échoue.

## Solution

1. **Vérifier `error` et `data`** dans la réponse de l'edge function avant d'incrémenter le compteur
2. **Valider le format du numéro** avant l'envoi (minimum 8 chiffres)
3. **Afficher un feedback visuel clair** : toast de succès avec le numéro invité, ou toast d'erreur explicite

## Modification dans `src/components/OnboardingExperience.tsx`

### `handleInvite` (lignes 134-147) — Réécriture

```typescript
const handleInvite = async () => {
  const phone = invitePhone.trim();
  if (!phone || !user) return;

  // Validate phone format (at least 8 digits)
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) {
    toast.error('Numéro invalide (min. 8 chiffres)');
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: {
        invitee_phone: phone,
        message: `${firstName || 'Un ami'} t'invite à rejoindre Joie de Vivre !`,
      },
    });

    if (error) {
      console.error('Invitation error:', error);
      toast.error("L'invitation n'a pas pu être envoyée");
      return;
    }

    setInvitedCount(c => c + 1);
    setInvitePhone('');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: ['#a855f7', '#ec4899'] });
    toast.success(`Invitation envoyée au ${phone} ! 🎉`);
  } catch {
    toast.error("Erreur lors de l'envoi");
  }
};
```

Changements clés :
- Validation du numéro (≥ 8 chiffres) avant appel réseau
- Vérification de `error` dans la réponse — le compteur n'est incrémenté que si `error` est null
- Toast de succès personnalisé avec le numéro pour confirmer visuellement quel contact a été invité

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Fiabiliser `handleInvite` avec validation + vérification erreur |

