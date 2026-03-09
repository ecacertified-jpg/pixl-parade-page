

## Plan : Refonte des métriques et harmonisation du dropdown profil

### Changements dans les statistiques

Remplacer les 3 métriques actuelles (Amis / Donnés / Points) par 3 métriques plus pertinentes avec icônes :

| Actuel | Nouveau | Icône | Donnée |
|--------|---------|-------|--------|
| Amis | 👥 Amis | `Users` | `stats.friendsCount` |
| Donnés → **Offerts** | 🎁 Offerts | `Gift` | `stats.giftsGiven` |
| Points → **Reçus** | 📦 Reçus | `PackageOpen` | `stats.giftsReceived` |

### Harmonisation visuelle du dropdown

- Ajouter des icônes colorées au-dessus de chaque métrique pour un rendu visuel plus joyeux
- Uniformiser les espacements et la taille des éléments
- Réduire légèrement le padding du header pour un dropdown plus compact sur mobile
- Arrondir les coins des sections statistiques

### Fichier impacté
- `src/components/ProfileDropdown.tsx`

