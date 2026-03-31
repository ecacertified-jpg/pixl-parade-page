

# Plan : Ajouter une section cagnotte permanente sur la page d'anniversaire

## Problème actuel

La section "Cadeau collectif" n'apparaît que si `page.fund_id` est renseigné (ligne 331). Si aucune cagnotte n'est liée à la page, les visiteurs ne voient rien — pas de CTA pour créer ou contribuer.

## Solution

Rendre la section cagnotte **toujours visible** avec 3 états possibles :

1. **Cagnotte liée** (déjà implémenté) : afficher la barre de progression + bouton "Participer"
2. **Cagnotte existante non liée** : chercher les cagnottes actives dont le `creator_id` correspond au `page.user_id` avec `occasion = 'birthday'` — les afficher avec possibilité de contribuer
3. **Aucune cagnotte** : afficher un CTA invitant les visiteurs à créer une cagnotte pour cette personne

## Modification unique : `src/pages/BirthdayPage.tsx`

### A. Rechercher les cagnottes existantes pour le birthday person

Dans `loadPage()`, après le chargement du fund lié, ajouter une recherche de cagnottes actives pour cet utilisateur si aucun `fund_id` n'est lié :

```typescript
// Si pas de fund_id lié, chercher les cagnottes birthday actives pour cet utilisateur
if (!pageData.fund_id) {
  const { data: existingFunds } = await supabase
    .from('collective_funds')
    .select('id, title, target_amount, current_amount, share_token')
    .eq('creator_id', pageData.user_id)
    .eq('occasion', 'birthday')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingFunds && existingFunds.length > 0) {
    setFund(existingFunds[0] as FundInfo);
  }
}
```

### B. Afficher un CTA quand aucune cagnotte n'existe

Remplacer le bloc conditionnel `{fund && (...)}` par un bloc qui affiche toujours la section :

- **Si `fund` existe** : conserver l'affichage actuel (barre de progression + bouton "Participer au cadeau")
- **Si `fund` est null** : afficher une carte invitante avec :
  - Icône cadeau + titre "Offrir un cadeau collectif à {firstName}"
  - Texte : "Réunissez-vous entre amis pour offrir un cadeau mémorable !"
  - Bouton "Créer une cagnotte" qui redirige vers `/gifts` (ou `/auth` si non connecté) avec le contexte du bénéficiaire

```
┌─────────────────────────────┐
│ 🎁 Cadeau collectif         │
│                             │
│ [Si fund existe]            │
│  Barre de progression       │
│  X / Y XOF                  │
│  [Participer au cadeau]     │
│                             │
│ [Si pas de fund]            │
│  Réunissez-vous entre amis  │
│  pour offrir un cadeau      │
│  mémorable à {firstName} !  │
│                             │
│  [🎁 Créer une cagnotte]    │
│  [💝 Contribuer]            │
└─────────────────────────────┘
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/BirthdayPage.tsx` | Rechercher cagnottes existantes + afficher CTA permanent |

