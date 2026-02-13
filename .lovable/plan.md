
# Afficher les stats Utilisateurs/Entreprises par administrateur

## Contexte

Le backend (edge function `admin-list-admins`) retourne deja les statistiques `stats: { users, businesses }` pour chaque administrateur, calculees en fonction de leurs pays assignes. Il ne reste qu'a les afficher dans l'interface.

## Modifications

### Fichier unique : `src/pages/Admin/AdminManagement.tsx`

**Vue desktop (tableau)** - Ajouter deux colonnes entre "Pays" et "Date d'attribution" :

```text
| Administrateur | Role | Pays | Utilisateurs | Entreprises | Date | Statut | Actions |
```

- Colonne "Utilisateurs" : icone Users + nombre (ex: `👥 245`)
- Colonne "Entreprises" : icone Building2 + nombre (ex: `🏢 27`)
- Si `stats` absent, afficher "—"

**Vue mobile (cartes)** - Ajouter une ligne de stats entre les badges pays et la date :

```text
👥 245 utilisateurs  ·  🏢 27 entreprises
```

Affichee avec des icones subtiles et du texte `text-sm text-muted-foreground`.

### Aucun autre fichier a modifier

- L'edge function retourne deja les stats
- Les RPC functions existent deja en base
- Le type `Admin` contient deja `stats?`
- Les icones `Users` et `Building2` sont deja importees
