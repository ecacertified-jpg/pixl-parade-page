

# Plan : Generer un lien a copier apres saisie du telephone

## Probleme

Quand l'utilisateur saisit un numero de telephone dans l'onboarding et clique sur la fleche, l'edge function `send-invitation` enregistre l'invitation en base mais **n'envoie rien** car elle ne gere que l'email (via Resend). Le message "+1 ami invite" est trompeur.

## Solution

Apres l'enregistrement reussi de l'invitation, afficher un **lien copiable** que l'utilisateur peut partager manuellement (via WhatsApp, SMS, etc.) au lieu de pretendre que l'ami a ete notifie.

### Comportement cible

1. L'utilisateur saisit un numero et clique sur la fleche
2. L'invitation est enregistree en base (comme aujourd'hui)
3. Au lieu de "+1 ami invite", afficher le lien d'invitation avec un bouton "Copier le lien"
4. L'utilisateur copie le lien et l'envoie lui-meme a son ami
5. Un bouton "Envoyer via WhatsApp" pre-remplit un message WhatsApp avec le lien

### Modifications dans `src/components/OnboardingExperience.tsx`

**1. Ajouter un state pour stocker le lien genere**

```typescript
const [generatedLink, setGeneratedLink] = useState<string | null>(null);
```

**2. Modifier `handleInvite` (lignes 134-164)**

Apres le succes de l'appel edge function, au lieu du toast "Invitation envoyee", generer le lien :

```typescript
const invitationLink = `https://joiedevivre-africa.com/auth?invited=true&ref=${data?.invitation_id || ''}`;
setGeneratedLink(invitationLink);
setInvitedCount(c => c + 1);
setInvitePhone('');
confetti(...);
```

**3. Modifier le rendu de l'etape "Amis" (step 3)**

Apres la saisie du telephone, si `generatedLink` existe, afficher :
- Le lien dans un champ texte en lecture seule
- Un bouton "Copier le lien" qui utilise `navigator.clipboard.writeText()`
- Un bouton "Envoyer via WhatsApp" qui ouvre `wa.me/?text=...` avec le lien
- Un toast de confirmation "Lien copie !"
- Le compteur "+N ami(s) invite(s)" reste visible

Quand l'utilisateur saisit un nouveau numero, `generatedLink` est remis a null.

**4. Ajuster le toast**

Remplacer `toast.success('Invitation envoyee au ${phone}')` par `toast.info('Partagez ce lien avec votre ami')`.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter le state `generatedLink`, modifier `handleInvite`, afficher le lien copiable |

