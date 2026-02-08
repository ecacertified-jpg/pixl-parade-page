

# Corriger l'erreur "Database error saving new user"

## Probleme identifie

L'erreur "Database error saving new user" se produit parce que le trigger `handle_new_user()` tente d'inserer des donnees dans la table `user_reciprocity_preferences` avec des colonnes qui n'existent plus :
- `alert_threshold` (n'existe pas)
- `reminder_frequency` (n'existe pas)
- `enable_suggestions` (n'existe pas)
- `enable_notifications` (n'existe pas)
- `private_mode` (n'existe pas)

Les colonnes actuelles de la table sont :
- `enable_reciprocity_system`, `enable_for_birthdays`, `enable_for_academic`, `enable_for_weddings`, `enable_for_promotions`, `show_generosity_badge`, `notify_on_friend_fund`, `min_reciprocity_score`, `notify_high_priority_only`

Cette erreur bloque **toute nouvelle inscription** (email ou autre).

## Solution

Mettre a jour la fonction `handle_new_user()` via une migration SQL pour utiliser les bonnes colonnes de la table `user_reciprocity_preferences`.

## Detail technique

### Migration SQL

Recreer la fonction `handle_new_user()` en remplacant l'INSERT dans `user_reciprocity_preferences` :

**Avant (cassé) :**
```sql
INSERT INTO public.user_reciprocity_preferences (
  user_id, alert_threshold, reminder_frequency,
  enable_suggestions, enable_notifications, private_mode
)
VALUES (NEW.id, 2.0, 'monthly', true, true, false)
ON CONFLICT (user_id) DO NOTHING;
```

**Apres (corrigé) :**
```sql
INSERT INTO public.user_reciprocity_preferences (user_id)
VALUES (NEW.id)
ON CONFLICT (user_id) DO NOTHING;
```

Cela inserera une ligne avec toutes les valeurs par defaut de la table (les colonnes booleennes ont deja des defauts). La partie profil de la fonction reste inchangee.

### Fichier concerne

- Migration SQL uniquement (aucun fichier frontend a modifier)

