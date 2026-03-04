

# Corriger l'envoi du template `joiedevivre_fund_completed`

## Diagnostic

Tous les envois de `joiedevivre_fund_completed` échouent avec l'erreur Meta **#132012** ("Parameter format does not match format in the created template"). Les logs montrent 3 échecs consécutifs.

**Cause probable** : le template a un **HEADER IMAGE** (visible dans la capture Meta). Pour les templates WhatsApp avec un header média (image/vidéo), Meta exige de passer l'URL de l'image dans un composant `header` à chaque envoi, même si une image sample a été fournie lors de la création du template. Or, la fonction `sendWhatsAppTemplate` ne supporte actuellement que les composants `body` et `button` — aucun composant `header` n'est envoyé.

## Solution

### 1. Étendre `sendWhatsAppTemplate` (sms-sender.ts)

Ajouter un paramètre optionnel `headerImageUrl` à la signature. Quand fourni, insérer un composant `header` avec type `image` avant les composants body/button :

```typescript
// Nouveau paramètre optionnel
headerImageUrl?: string

// Composant ajouté dans le tableau components
if (headerImageUrl) {
  components.unshift({
    type: 'header',
    parameters: [{ type: 'image', image: { link: headerImageUrl } }],
  });
}
```

### 2. Passer l'image dans `notify-fund-ready` (appel fund_completed)

Utiliser l'URL publique du logo Joie de Vivre hébergé (à confirmer — probablement dans le bucket Supabase storage ou un CDN). Ajouter `headerImageUrl` à l'appel `sendWhatsAppTemplate` pour le template `joiedevivre_fund_completed` uniquement.

### 3. Déployer et tester

- Déployer les deux edge functions modifiées
- Supprimer la notification de déduplication existante pour le fund test
- Appeler `notify-fund-ready` avec le fund `efacddcb...` pour vérifier l'envoi réel

## Fichiers concernés

- **Modifié** : `supabase/functions/_shared/sms-sender.ts` — ajout du support header image
- **Modifié** : `supabase/functions/notify-fund-ready/index.ts` — passer l'URL image au template fund_completed
- **Déploiement** : `notify-fund-ready`

## Question ouverte

Il me faut l'URL publique exacte de l'image header du template (le logo Joie de Vivre avec les cadeaux visible dans la capture Meta). Est-ce une image hébergée dans votre storage Supabase, ou avez-vous une URL CDN à utiliser ?

