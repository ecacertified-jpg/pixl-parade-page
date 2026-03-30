

# Plan : Envoyer `joiedevivre_join_reminder` aux utilisateurs inscrits sans cercle d'amis

## Contexte

Actuellement :
- `notify-contacts-join-reminder` → cible les **contacts non inscrits** (linked_user_id IS NULL)
- `check-friends-circle-reminders` → cible les **utilisateurs inscrits avec < N contacts** via le template `joiedevivre_friends_circle_reminder`

L'objectif est d'ajouter dans `notify-contacts-join-reminder` une **seconde phase** ciblant les utilisateurs inscrits qui n'ont **aucun contact** (cercle vide), en leur envoyant le même template `joiedevivre_join_reminder` avec l'image header.

## Modification

### Fichier : `supabase/functions/notify-contacts-join-reminder/index.ts`

Ajouter une **Phase 2** après la boucle contacts existante (ligne 133) :

1. Requêter les `profiles` inscrits depuis > 7 jours, ayant un phone, et n'ayant **aucun contact** dans la table `contacts`
2. Appliquer la même déduplication (alert_type `join_reminder_registered`, 14 jours)
3. Envoyer `joiedevivre_join_reminder` avec `bodyParameters: ["Joie de Vivre"]` (pas de "owner" ici, c'est la plateforme qui invite) et le header image
4. Logger dans `birthday_contact_alerts` avec `alert_type: 'join_reminder_registered'` pour distinguer des contacts non inscrits

```text
Phase 1 (existante) : contacts non inscrits → "X t'a ajouté..."
Phase 2 (nouvelle)  : utilisateurs inscrits sans contacts → "Crée ton cercle..."
```

### Requête Phase 2

```sql
SELECT p.user_id, p.first_name, p.phone
FROM profiles p
WHERE p.phone IS NOT NULL
  AND p.created_at <= cutoff_date
  AND NOT EXISTS (SELECT 1 FROM contacts c WHERE c.user_id = p.user_id)
  AND NOT EXISTS (
    SELECT 1 FROM birthday_contact_alerts bca
    WHERE bca.contact_phone = p.phone
      AND bca.alert_type = 'join_reminder_registered'
      AND bca.created_at >= dedup_date
  )
```

Ceci sera traduit en appels Supabase JS (sous-requête via `.not()` ou en deux étapes : lister les user_ids ayant des contacts, puis exclure).

### Paramètres du template

- `bodyParameters`: `[firstName]` (prénom de l'utilisateur)
- `buttonParameters`: `undefined` (CTA statique)
- `headerImageUrl`: même `JOIN_REMINDER_IMAGE_URL`

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contacts-join-reminder/index.ts` | Ajouter Phase 2 pour utilisateurs inscrits sans contacts |

