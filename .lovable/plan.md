

# Personnalisation du SMS de bienvenue selon l'existence du compte

## Objectif

Adapter le message SMS envoyé au contact selon qu'il possède déjà un compte sur la plateforme ou non.

## Messages proposés

| Situation | Message | Longueur estimée |
|-----------|---------|------------------|
| **Compte existant** | `[Nom] t'a ajouté à son cercle! Ton anniversaire dans X jours. Tes souhaits de cadeaux ? joiedevivre-africa.com/favorites` | ~115 chars |
| **Nouveau contact** | `[Nom] t'a ajouté à son cercle! Ton anniversaire dans X jours. Ajoute des amis et profite de leur générosité: joiedevivre-africa.com` | ~130 chars |

Les deux messages restent sous la limite de 160 caractères.

---

## Solution technique

### Modification de `supabase/functions/notify-contact-added/index.ts`

Ajouter une vérification du numéro de téléphone dans `auth.users` avant de construire le message.

```text
┌─────────────────────────────────────────┐
│  1. Recevoir contact_phone              │
│                                         │
│  2. Normaliser le numéro                │
│     (+225, suffixe 8 chiffres)          │
│                                         │
│  3. Chercher dans auth.users            │
│     → Correspondance exacte ou suffixe  │
│                                         │
│  4. Si compte trouvé:                   │
│     → Message "Tes souhaits de cadeaux" │
│     → URL: /favorites                   │
│                                         │
│  5. Sinon:                              │
│     → Message "Ajoute des amis"         │
│     → URL: / (page d'accueil)           │
│                                         │
│  6. Envoyer SMS                         │
└─────────────────────────────────────────┘
```

### Code à ajouter (après ligne 134)

```typescript
// Vérifier si le contact a déjà un compte
const normalizedPhone = contact_phone.replace(/[\s\-\(\)]/g, '');
let hasExistingAccount = false;

const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
  perPage: 100
});

if (authUsers?.users) {
  for (const authUser of authUsers.users) {
    const userPhone = authUser.phone?.replace(/[\s\-\(\)]/g, '') || '';
    
    // Correspondance exacte ou par suffixe (8 derniers chiffres)
    const isExactMatch = userPhone === normalizedPhone;
    const isSuffixMatch = normalizedPhone.length >= 8 && 
      (userPhone.endsWith(normalizedPhone.slice(-8)) || 
       normalizedPhone.endsWith(userPhone.slice(-8)));
    
    if (isExactMatch || isSuffixMatch) {
      hasExistingAccount = true;
      console.log(`Contact ${contact_phone} has existing account: ${authUser.id}`);
      break;
    }
  }
}
```

### Message conditionnel (remplacer ligne 156)

```typescript
// Construire le message selon l'existence du compte
let message: string;

if (hasExistingAccount) {
  // Utilisateur existant → rediriger vers ses favoris
  message = `${userName} t'a ajouté à son cercle! Ton anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}. Tes souhaits de cadeaux ? joiedevivre-africa.com/favorites`;
} else {
  // Nouvel utilisateur → inciter à créer un compte
  message = `${userName} t'a ajouté à son cercle! Ton anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}. Ajoute des amis et profite de leur générosité: joiedevivre-africa.com`;
}
```

---

## Fichier modifié

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contact-added/index.ts` | Ajouter vérification compte + message conditionnel |

---

## Flux de données

```text
contact_phone: "0707467445"
        │
        ▼
┌───────────────────┐
│ Normaliser        │ → "+2250707467445" ou "0707467445"
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ auth.admin.       │
│ listUsers()       │ → Parcourir tous les utilisateurs
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Comparer suffixes │ → "07467445" == "07467445" ?
│ (8 derniers)      │
└───────────────────┘
        │
        ├── OUI → hasExistingAccount = true
        │         Message: "Tes souhaits de cadeaux ?"
        │
        └── NON → hasExistingAccount = false
                  Message: "Ajoute des amis..."
```

---

## Avantages

1. **Personnalisation** : Message adapté au contexte de l'utilisateur
2. **Meilleure conversion** : Les nouveaux utilisateurs sont incités à créer un compte
3. **Expérience cohérente** : Les utilisateurs existants sont redirigés vers leurs favoris
4. **Réutilisation** : Logique similaire à `check-existing-account` déjà testée

---

## Note technique

La recherche par suffixe (8 derniers chiffres) permet de gérer les différents formats de numéros :
- `0707467445` (format local)
- `+2250707467445` (format international)
- `2250707467445` (sans le +)

