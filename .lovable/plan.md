

# Plan : Incrémenter le compteur uniquement quand le formulaire est rempli

## Problème

Actuellement, `invitationsSentCount` s'incrémente dès que l'utilisateur clique sur "Partager WhatsApp", "Copier le lien" ou "SMS" — avant même que l'invité n'ait rempli le formulaire. Le compteur est donc trompeur.

## Solution

Remplacer l'incrémentation locale par un polling sur la table `friend_form_tokens` pour compter les tokens dont le `status === 'completed'`.

### Modifications dans `src/components/OnboardingExperience.tsx`

1. **Stocker les tokens générés** : maintenir un tableau `generatedTokens: string[]` qui s'enrichit à chaque appel de `handleGenerateFriendFormLink`

2. **Polling des formulaires complétés** : ajouter un `useEffect` avec un `setInterval` (toutes les 5 secondes) qui interroge `friend_form_tokens` pour compter les tokens de l'utilisateur courant ayant `status = 'completed'`

```text
SELECT count(*) FROM friend_form_tokens
WHERE user_id = current_user AND status = 'completed'
```

Mettre à jour `invitationsSentCount` avec ce count réel.

3. **Retirer les incrémentations manuelles** : supprimer les `setInvitationsSentCount(c => c + 1)` dans `handleShareFriendFormWhatsApp`, `handleCopyFriendFormLink` et `handleShareFriendFormSMS`

4. **Feedback immédiat au partage** : remplacer l'incrémentation par un simple toast de confirmation ("Lien partagé ! En attente de réponse...")

### Comportement final

```text
Clic "Partager WhatsApp" → Toast "Lien partagé !" (compteur reste à 0)
L'invité remplit le formulaire → status = 'completed' en base
Polling (5s) → compteur passe à 1/3
3 formulaires remplis → confettis + redirection auto
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Retirer incrémentations manuelles, ajouter polling sur `friend_form_tokens` |

