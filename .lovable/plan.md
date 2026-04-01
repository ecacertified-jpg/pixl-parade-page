

# Plan : Onglet "Anniversaires" style TikTok dans le Dashboard

## Resume

Ajouter un 6e onglet "Anniv." dans le Dashboard avec une grille de cards style TikTok (comme les videos sous un profil TikTok). L'onglet contient deux sous-onglets ("Cette annee" / "Souvenirs") chacun avec deux filtres ("Moi" / "Proches").

## Structure de l'onglet

```text
[Amis] [Events] [Cotis.] [Cadeaux] [Anniv.] [🏆]
                              ↓
         [Cette année]  [Souvenirs]
            [Moi]  [Proches]
                ↓
    ┌─────┐  ┌─────┐  ┌─────┐
    │ 🎂  │  │ 🎂  │  │ 🎂  │
    │cover│  │cover│  │cover│
    │ nom │  │ nom │  │ nom │
    │ year│  │ year│  │ year│
    └─────┘  └─────┘  └─────┘
```

Chaque card affiche : image de couverture (ou gradient par defaut), prenom, annee, nombre de messages/voeux. Un clic ouvre la page `/birthday/:slug`.

## Donnees

- **"Moi"** : `birthday_pages` ou `user_id = auth.uid()`
- **"Proches"** : `birthday_pages` de mes contacts (via `contacts.linked_user_id`) + pages auxquelles j'ai contribue (via `birthday_wishes_messages.sender_user_id` ou `fund_contributions.contributor_id`)
- **"Cette annee"** : `celebration_year = annee courante`
- **"Souvenirs"** : `celebration_year < annee courante`
- Tri : du plus recent au plus ancien

## Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `src/components/BirthdaysTab.tsx` | **Nouveau** - composant principal de l'onglet avec sous-onglets et grille TikTok |
| `src/components/BirthdayGridCard.tsx` | **Nouveau** - card individuelle style TikTok (cover, nom, annee, compteur voeux) |
| `src/hooks/useBirthdayPages.ts` | **Nouveau** - hook pour fetch les birthday_pages (moi + proches, cette annee + souvenirs) |
| `src/pages/Dashboard.tsx` | **Modifier** - ajouter le 6e onglet "Anniv." avec icone Cake, grid-cols-6, et le TabsContent correspondant |

## Details techniques

### Hook `useBirthdayPages`
- Fetch `birthday_pages` avec jointure sur `profiles` (first_name, avatar_url) pour obtenir le nom et la photo
- Pour "Proches" : fetch les `linked_user_id` depuis `contacts`, puis les `birthday_pages` de ces users
- Compter les `birthday_wishes_messages` par page (count query)
- Separer par annee courante vs anterieures

### Composant `BirthdayGridCard`
- Aspect ratio 3:4 (comme TikTok)
- Image de couverture ou gradient violet/rose par defaut
- Overlay en bas : prenom, annee de celebration
- Badge avec nombre de voeux
- Clic → `navigate('/birthday/${slug}')`

### Composant `BirthdaysTab`
- Sous-onglets "Cette annee" / "Souvenirs" (Tabs imbriques ou boutons toggle)
- Filtre "Moi" / "Proches" (chips/boutons)
- Grille `grid-cols-3 gap-1` (exactement comme TikTok)
- Etat vide avec message encourageant ("Creez votre page d'anniversaire !")

### Dashboard.tsx
- Changer `grid-cols-5` en `grid-cols-6` dans le TabsList
- Ajouter le TabsTrigger "Anniv." avec icone `Cake`
- Ajouter le TabsContent avec `<BirthdaysTab />`

