

# Deuxième palier de notification : 14 jours d'inactivité

## Approche

Modifier la edge function `check-inactive-users` pour gérer deux paliers d'inactivité avec des messages différents selon la durée. Le palier 14 jours utilise des messages plus urgents avec mention d'une offre spéciale. La colonne `message_variant` existante dans `inactive_user_notifications` suffit pour distinguer les paliers -- on ajoute un champ `tier` pour tracker explicitement le palier.

## Modifications

### 1. Migration : ajouter colonne `tier` à `inactive_user_notifications`
- Ajouter `tier integer NOT NULL DEFAULT 1` pour distinguer palier 1 (7j) et palier 2 (14j)
- Permet de vérifier le cooldown par palier (un user peut recevoir le palier 1 à J7, puis le palier 2 à J14, mais pas deux fois le même palier dans les 7 jours)

### 2. Edge function `check-inactive-users`
- Ajouter un tableau `urgentReengagementMessages` avec 5-6 messages urgents mentionnant une offre spéciale (ex: "Offre exclusive : -20% sur ta première cagnotte !")
- Modifier la logique de filtrage : pour chaque utilisateur inactif, calculer `daysSinceActive` et déterminer le palier (1 si 7-13 jours, 2 si 14+ jours)
- Vérifier le cooldown par palier : un utilisateur ne reçoit pas le même palier deux fois en 7 jours
- Utiliser les messages urgents pour le palier 2, les messages standard pour le palier 1
- Ajouter `tier` et `has_special_offer: true` dans les metadata de la notification in-app pour le palier 2
- Logger le `tier` dans `inactive_user_notifications`

### Messages palier 2 (exemples)
- "Dernière chance ! Offre -20% sur ta première cagnotte"
- "Tes amis célèbrent sans toi... Reviens avec un bonus exclusif"
- "Offre spéciale : crée une cagnotte gratuite cette semaine"

### Fichiers impactés
| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter `tier` à `inactive_user_notifications` |
| `supabase/functions/check-inactive-users/index.ts` | Logique double palier + messages urgents |

