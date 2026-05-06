# Correction — Erreur de contribution invité aux cagnottes

## Cause racine
La fonction Edge `contribute-as-guest` insère bien la contribution avec `contributor_id = NULL` (cas invité). Mais le trigger `trigger_auto_gratitude` (sur INSERT de `fund_contributions`) appelle `create_auto_gratitude()` qui insère dans `gratitude_wall` avec `contributor_id = NEW.contributor_id`. Or `gratitude_wall.contributor_id` est `NOT NULL`, ce qui provoque l'erreur :

```
null value in column "contributor_id" of relation "gratitude_wall" violates not-null constraint
```

Ce qui fait remonter côté client : « Impossible d'enregistrer la contribution ».

## Correction

Migration SQL : modifier `public.create_auto_gratitude()` pour ignorer la création du message de gratitude automatique quand `NEW.contributor_id IS NULL` (cas invité), et utiliser `NEW.guest_name` pour le libellé si disponible.

```sql
CREATE OR REPLACE FUNCTION public.create_auto_gratitude()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fund_creator UUID;
  contributor_name TEXT;
  fund_title TEXT;
BEGIN
  SELECT creator_id, title INTO fund_creator, fund_title
  FROM public.collective_funds WHERE id = NEW.fund_id;

  -- Cas invité : pas de contributor_id → on saute (gratitude_wall exige NOT NULL)
  IF NEW.contributor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(first_name || ' ' || last_name, 'Un généreux donateur')
  INTO contributor_name
  FROM public.profiles WHERE user_id = NEW.contributor_id;

  INSERT INTO public.gratitude_wall (
    fund_id, contributor_id, beneficiary_id,
    message_type, message_text, is_public
  ) VALUES (
    NEW.fund_id, NEW.contributor_id, fund_creator, 'auto',
    '✨ ' || contributor_name || ' a contribué ' || NEW.amount || ' ' || NEW.currency ||
    ' à la cagnotte "' || fund_title || '". Merci pour ce geste généreux ! 💝',
    true
  );

  RETURN NEW;
END;
$$;
```

## Vérification post-fix
- Re-tester `contribute-as-guest` via curl avec un fund public → doit renvoyer 200.
- Inspecter les autres triggers AFTER INSERT (`track_contribution_for_reciprocity`, `award_points_contribution`, `trigger_badge_check`, `handle_contribution_activity`, `notify_on_contribution`, `notify_contribution_progress_trigger`) pour s'assurer qu'ils gèrent `contributor_id NULL`. Si l'un d'eux échoue aussi sur invité, appliquer le même garde-fou (early RETURN).

## Fichiers impactés
- Nouvelle migration SQL (aucun fichier client).
