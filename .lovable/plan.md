

## Corriger la liaison automatique et remplir les `linked_user_id` manquants

### Diagnostic

- **80 contacts** avec telephone, **0 lies** (`linked_user_id = NULL` partout)
- **29 contacts** correspondent deja a un utilisateur inscrit (par les 8 derniers chiffres)
- **Cause racine** : le trigger `handle_new_user` ne s'execute qu'a l'inscription (`INSERT` dans `auth.users`). Tous les utilisateurs existants ont ete crees **avant** l'ajout du code de liaison, et les contacts sont souvent ajoutes **apres** l'inscription.

### Plan en 3 etapes

---

### Etape 1 — Migration de backfill retroactif

Script SQL qui parcourt tous les contacts non lies et cherche une correspondance par les 8 derniers chiffres du numero dans `profiles.phone` (qui contient le format E.164).

```text
-- Pour chaque contact sans linked_user_id, trouver le profil correspondant
UPDATE contacts c
SET linked_user_id = p.user_id
FROM profiles p
WHERE c.linked_user_id IS NULL
  AND c.phone IS NOT NULL
  AND p.phone IS NOT NULL
  AND RIGHT(regexp_replace(c.phone, '[^0-9]', '', 'g'), 8)
    = RIGHT(regexp_replace(p.phone, '[^0-9]', '', 'g'), 8)
  AND c.user_id <> p.user_id;   -- Ne pas se lier soi-meme
```

Puis creer les `contact_relationships` manquantes pour chaque liaison trouvee :

```text
INSERT INTO contact_relationships (user_a, user_b, can_see_events, can_see_funds)
SELECT c.user_id, c.linked_user_id, true, true
FROM contacts c
WHERE c.linked_user_id IS NOT NULL
ON CONFLICT ON CONSTRAINT unique_relationship DO NOTHING;
```

Resultat attendu : **~29 contacts** lies retroactivement.

---

### Etape 2 — Nouveau trigger sur INSERT dans `contacts`

Le trigger actuel ne couvre que l'inscription. Il faut aussi lier automatiquement quand un contact est **ajoute** :

```text
CREATE FUNCTION public.auto_link_contact_on_insert()
  RETURNS trigger AS $$
DECLARE
  clean_phone TEXT;
  phone_suffix TEXT;
  found_user_id UUID;
BEGIN
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    RETURN NEW;
  END IF;

  clean_phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  phone_suffix := RIGHT(clean_phone, 8);

  IF LENGTH(phone_suffix) < 8 THEN
    RETURN NEW;
  END IF;

  -- Chercher un profil correspondant
  SELECT user_id INTO found_user_id
  FROM profiles
  WHERE phone IS NOT NULL
    AND RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 8) = phone_suffix
    AND user_id <> NEW.user_id
  LIMIT 1;

  IF found_user_id IS NOT NULL THEN
    NEW.linked_user_id := found_user_id;

    -- Creer la relation bidirectionnelle
    INSERT INTO contact_relationships (user_a, user_b, can_see_events, can_see_funds)
    VALUES (NEW.user_id, found_user_id, true, true)
    ON CONFLICT ON CONSTRAINT unique_relationship DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_link_contact
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_contact_on_insert();
```

Utilise `BEFORE INSERT` pour pouvoir modifier `NEW.linked_user_id` directement, evitant un UPDATE supplementaire.

---

### Etape 3 — Conserver le trigger `handle_new_user` existant

Le code actuel dans `handle_new_user` (liaison a l'inscription) reste en place. Il couvre le cas inverse : un utilisateur s'inscrit et des contacts existants contiennent deja son numero. Les deux triggers sont complementaires :

| Scenario | Trigger |
|----------|---------|
| Utilisateur s'inscrit, contacts existants avec son numero | `handle_new_user` (deja en place) |
| Utilisateur ajoute un contact dont le numero correspond a un inscrit | `auto_link_contact_on_insert` (nouveau) |
| Contacts existants jamais lies (historique) | Script de backfill (etape 1) |

---

### Fichiers modifies

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer : backfill UPDATE + nouveau trigger `auto_link_contact_on_insert` |

### Aucun changement frontend

Le frontend utilise deja `linked_user_id` correctement (badge "Sur l'app", wishlist, invitation). Une fois les donnees remplies, tout fonctionnera automatiquement.

