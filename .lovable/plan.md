

## Détails complets utilisateurs/contacts depuis les anniversaires admin

### Objectif

Ajouter un panneau de détail (Dialog/Sheet) qui s'ouvre quand un admin clique sur une ligne du tableau d'anniversaires, affichant les informations complètes de l'utilisateur ou du contact.

### Approche

#### 1. Enrichir les données dans `useAdminBirthdays.ts`

Récupérer plus de champs lors du chargement :

- **Profiles** : ajouter `avatar_url, phone, email (via auth?), city, country_code, bio, created_at, is_suspended, total_birthdays_celebrated`
- **Contacts** : ajouter `avatar_url, phone, email, relationship, notes, created_at`
- Pour les contacts, aussi récupérer le nom du propriétaire via un lookup sur profiles (`ownerName`)

Étendre l'interface `BirthdayEntry` avec ces champs optionnels :
```typescript
export interface BirthdayEntry {
  // existants...
  avatarUrl?: string;
  phone?: string;
  email?: string;
  city?: string;
  countryCode?: string;
  bio?: string;
  relationship?: string;
  notes?: string;
  createdAt?: string;
  isSuspended?: boolean;
  totalBirthdaysCelebrated?: number;
}
```

#### 2. Créer un composant `BirthdayDetailSheet`

Nouveau fichier `src/components/admin/BirthdayDetailSheet.tsx` :

- Utilise `Sheet` (panneau latéral) de shadcn/ui
- Affiche selon le type :
  - **Utilisateur** : avatar, nom complet, téléphone, ville/pays, bio, date d'inscription, statut (suspendu ou non), nombre d'anniversaires célébrés, lien vers `/admin/users`
  - **Contact** : avatar, nom, téléphone, email, relation, notes, propriétaire (avec lien), date de création
- Badge d'urgence anniversaire en haut
- Bouton d'action "Voir le profil complet" qui navigue vers la page admin détaillée

#### 3. Modifier `AdminBirthdays.tsx`

- Ajouter un state `selectedEntry` pour l'entrée sélectionnée
- Rendre chaque `TableRow` cliquable (`onClick` + `cursor-pointer`)
- Intégrer `BirthdayDetailSheet` avec `open/onClose`

### Fichiers

| Fichier | Action |
|---------|--------|
| `src/hooks/useAdminBirthdays.ts` | Modifier — enrichir les requêtes et l'interface |
| `src/components/admin/BirthdayDetailSheet.tsx` | Créer — panneau de détail |
| `src/pages/Admin/AdminBirthdays.tsx` | Modifier — lignes cliquables + intégration Sheet |

Aucune migration DB nécessaire.

