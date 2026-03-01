

# Correction de l'integrite des relations symetriques

## Probleme

La table `contact_relationships` utilise une contrainte `UNIQUE(user_a, user_b)` qui ne detecte pas les inversions. Quand deux utilisateurs s'ajoutent mutuellement, deux lignes sont creees pour la meme amitie. Cela cause :
- **Notifications en double** (WhatsApp envoye 2 fois si deduplication par telephone absente)
- **Comptage d'amis incorrect** (un ami compte double)
- **Donnees incoherentes** (can_see_funds peut differer entre les 2 lignes)

**Etat actuel** : 4 paires de doublons sur 34 relations.

## Plan de correction

### Etape 1 -- Nettoyage des doublons existants

Migration SQL :
1. Pour chaque paire de doublons (A,B) et (B,A), conserver la ligne la plus ancienne et supprimer l'autre
2. Fusionner les permissions : si l'une des deux lignes a `can_see_funds = true`, la ligne conservee doit aussi l'avoir

### Etape 2 -- Normaliser les donnees existantes

Mettre a jour toutes les lignes pour que `user_a` soit toujours le plus petit UUID (LEAST) et `user_b` le plus grand (GREATEST). Cela garantit une forme canonique.

### Etape 3 -- Ajouter un index unique symetrique

```text
CREATE UNIQUE INDEX idx_contact_relationships_symmetric
ON contact_relationships (LEAST(user_a, user_b), GREATEST(user_a, user_b));
```

Cet index empeche toute insertion de (B,A) si (A,B) existe deja, quelle que soit l'ordre.

### Etape 4 -- Modifier les triggers d'auto-link

Mettre a jour les fonctions `auto_link_contact_on_insert()` et `auto_link_contact_on_update()` pour :
- Toujours inserer avec `LEAST/GREATEST` pour normaliser l'ordre
- Utiliser `ON CONFLICT` sur le nouvel index symetrique

Changement dans les deux fonctions :
```text
-- Avant :
INSERT INTO contact_relationships (user_a, user_b, ...)
VALUES (NEW.user_id, found_user_id, ...)

-- Apres :
INSERT INTO contact_relationships (user_a, user_b, ...)
VALUES (LEAST(NEW.user_id, found_user_id), GREATEST(NEW.user_id, found_user_id), ...)
```

### Etape 5 -- Modifier le trigger handle_new_user

Meme correction dans la fonction `handle_new_user` (inscription) qui cree aussi des `contact_relationships`.

### Fichiers concernes

| Fichier / Ressource | Action |
|----------------------|--------|
| Migration SQL (nouvelle) | Nettoyage doublons + index symetrique + normalisation |
| `auto_link_contact_on_insert()` | LEAST/GREATEST dans l'INSERT (via migration) |
| `auto_link_contact_on_update()` | LEAST/GREATEST dans l'INSERT (via migration) |
| `handle_new_user()` | LEAST/GREATEST dans l'INSERT (via migration) |

### Impact

- Les 4 paires de doublons existantes seront fusionnees (34 lignes -> 30 lignes)
- Les ajouts mutuels futurs ne creent plus de doublons
- Les notifications, comptages d'amis et permissions restent coherents
- Aucun changement cote frontend (les requetes existantes utilisent deja `OR` pour les deux directions)
- Aucune perte de donnees : les permissions sont fusionnees avant suppression

