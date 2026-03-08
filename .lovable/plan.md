

## Plan: Enrichir les infos anniversaires admin + colonne Relation

### Probleme
Le tableau des resultats n'affiche que Nom, Date, Echeance et Type. L'admin doit cliquer pour voir les details. La colonne "Relation" (famille, ami, collegue...) n'apparait nulle part dans le tableau, et pour les utilisateurs (type `user`), aucune info de relation n'est disponible car seuls les contacts ont ce champ.

### Modifications

#### 1. `src/pages/Admin/AdminBirthdays.tsx` — Ajouter des colonnes au tableau

Ajouter les colonnes suivantes au tableau des resultats :
- **Relation** : affiche `entry.relationship` avec un badge colore selon le type (famille, ami, collegue, etc.)
- **Telephone** : affiche `entry.phone`
- **Proprietaire** : affiche `entry.ownerName` (pour les contacts uniquement)

Sur mobile, masquer les colonnes Telephone et Proprietaire avec `hidden md:table-cell`.

Mapper les relations vers des labels francais lisibles :
```
family → Famille, father → Pere, mother → Mere, 
sister → Soeur, brother → Frere, friend → Ami(e), 
colleague → Collegue
```

#### 2. `src/components/admin/BirthdayDetailSheet.tsx` — Enrichir le panneau de detail

- Afficher la relation avec un badge colore bien visible (pas juste du texte)
- Ajouter le champ `neighborhood` (quartier) pour les utilisateurs
- Afficher `email` pour les utilisateurs aussi (actuellement uniquement contacts)
- Ajouter le nombre de referrals (`total_referrals`) pour les utilisateurs
- Organiser les infos en sections visuelles : Coordonnees, Profil, Activite

#### 3. `src/hooks/useAdminBirthdays.ts` — Recuperer les champs manquants

- Ajouter `email` et `neighborhood` dans la requete profiles
- Ajouter ces champs dans l'interface `BirthdayEntry`
- Mapper les nouveaux champs dans la construction des entries

### Interface BirthdayEntry — champs ajoutes
```typescript
neighborhood?: string;
email?: string;       // deja present pour contacts, ajouter pour users
totalReferrals?: number;
```

### Aucune migration SQL necessaire
Tous les champs existent deja dans les tables.

