

## Ajouter un trigger `auto_link_contact_on_update`

### Contexte

Actuellement, la liaison automatique fonctionne pour :
- L'inscription d'un nouvel utilisateur (`handle_new_user`)
- L'ajout d'un nouveau contact (`auto_link_contact_on_insert`)

Mais si un utilisateur **modifie** le numero de telephone d'un contact existant, aucune re-liaison n'est effectuee. Ce trigger comble ce manque.

### Implementation

Une seule migration SQL qui :

1. **Cree la fonction `auto_link_contact_on_update()`** — declenchee `BEFORE UPDATE` sur `contacts`, elle verifie si le numero a change (`OLD.phone IS DISTINCT FROM NEW.phone`). Si oui, elle applique la meme logique de correspondance par les 8 derniers chiffres que le trigger d'insertion :
   - Trouve un profil correspondant dans `profiles`
   - Met a jour `NEW.linked_user_id`
   - Cree une entree dans `contact_relationships` si necessaire
   - Si le nouveau numero ne correspond a personne, remet `linked_user_id` a `NULL`

2. **Cree le trigger `trg_auto_link_contact_on_update`** sur la table `contacts`

### Details techniques

```text
CREATE OR REPLACE FUNCTION public.auto_link_contact_on_update()
  RETURNS trigger AS $$
DECLARE
  clean_phone TEXT;
  phone_suffix TEXT;
  found_user_id UUID;
BEGIN
  -- Ne rien faire si le telephone n'a pas change
  IF OLD.phone IS NOT DISTINCT FROM NEW.phone THEN
    RETURN NEW;
  END IF;

  -- Si le nouveau numero est vide, retirer la liaison
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    NEW.linked_user_id := NULL;
    RETURN NEW;
  END IF;

  clean_phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  phone_suffix := RIGHT(clean_phone, 8);

  IF LENGTH(phone_suffix) < 8 THEN
    NEW.linked_user_id := NULL;
    RETURN NEW;
  END IF;

  SELECT user_id INTO found_user_id
  FROM profiles
  WHERE phone IS NOT NULL
    AND RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 8) = phone_suffix
    AND user_id <> NEW.user_id
  LIMIT 1;

  IF found_user_id IS NOT NULL THEN
    NEW.linked_user_id := found_user_id;
    INSERT INTO contact_relationships (user_a, user_b, can_see_events, can_see_funds)
    VALUES (NEW.user_id, found_user_id, true, true)
    ON CONFLICT ON CONSTRAINT unique_relationship DO NOTHING;
  ELSE
    NEW.linked_user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_link_contact_on_update
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_contact_on_update();
```

### Points cles

- Utilise `BEFORE UPDATE` pour modifier `NEW.linked_user_id` directement (pas d'UPDATE supplementaire)
- Ne se declenche que si le numero a reellement change (`IS DISTINCT FROM`)
- Remet `linked_user_id` a `NULL` si le nouveau numero ne correspond a personne
- Meme logique de normalisation (8 derniers chiffres) que les triggers existants
- `SECURITY DEFINER` pour acceder a `profiles` et `contact_relationships` sans restriction RLS

### Fichiers modifies

| Fichier | Action |
|---------|--------|
| Migration SQL | Nouvelle migration avec la fonction + le trigger |

### Couverture complete des scenarios

| Scenario | Trigger |
|----------|---------|
| Utilisateur s'inscrit | `handle_new_user` |
| Contact ajoute | `auto_link_contact_on_insert` |
| **Numero de contact modifie** | **`auto_link_contact_on_update` (nouveau)** |

