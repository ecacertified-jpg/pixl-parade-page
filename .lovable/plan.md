

# Plan : Ajouter la politique RLS DELETE manquante sur `invitations`

## Constat

| Politique | Existe | Correct |
|-----------|--------|---------|
| SELECT (own) | Oui | `inviter_id = auth.uid()` — OK |
| INSERT | Oui | `inviter_id = auth.uid()` — OK |
| UPDATE (own) | Oui | `inviter_id = auth.uid()` — OK |
| DELETE | **Non** | **Manquante** |

L'insertion fonctionne correctement (la politique INSERT est bien configuree). Cependant, la fonction `send-invitation` tente de supprimer l'invitation si l'envoi d'email echoue (nettoyage), et cette suppression echoue silencieusement sans politique DELETE.

De plus, il existe une contrainte UNIQUE sur `(inviter_id, invitee_email)`. Comme `invitee_email` est maintenant nullable, PostgreSQL traite les NULL comme distincts, donc les invitations par telephone uniquement ne sont pas bloquees par cette contrainte.

## Migration SQL

```sql
CREATE POLICY "Users can delete their own invitations"
ON public.invitations FOR DELETE
USING (inviter_id = auth.uid());
```

## Aucune modification de code necessaire

Le code client (`deleteInvitation` dans `useInvitations.ts`) et l'edge function utilisent deja les bons filtres (`inviter_id` / `eq('inviter_id', user.id)`).

## Fichier concerne

| Element | Action |
|---------|--------|
| Table `invitations` | Migration : ajouter politique DELETE |

