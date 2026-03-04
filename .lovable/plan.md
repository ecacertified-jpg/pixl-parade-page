

# Diagnostic: `joiedevivre_fund_completed` - 0 envois dans Meta

## Analyse des logs

Voici ce qui s'est passé lors des 2 derniers appels de `notify-fund-ready` pour le fund `efacddcb...` :

| Destinataire | Telephone | Statut | Erreur |
|---|---|---|---|
| Françoise (créatrice) | 0708*** | "sent" (API) | Aucune, mais Meta compte 0 |
| Aboutou WhatsApp | 0546*** | failed | `(#100) Invalid parameter` |
| Aboutou WhatsApp | 0707*** | **ignoré** | Phone identique au prestataire NewTech (dedup) |
| Amtey Florentin | aucun | - | Pas de telephone, in-app uniquement |

## Problemes identifies

### 1. Retour de `sendWhatsAppTemplate` non verifie (bug code)
Dans `notifyFriend()`, le resultat de `sendWhatsAppTemplate` n'est pas inspecte. Meme si la fonction retourne `{ success: false }`, le code compte quand meme `friendWaSent++` et ajoute le phone au Set de deduplication. Cela fausse les compteurs et empeche les re-envois.

### 2. Meta dashboard a 0 malgre un `wamid` valide
L'API Meta a accepte le message pour Françoise (retourne un `wamid`), mais le template `joiedevivre_fund_completed` est categorise **Marketing** dans Meta. Les templates Marketing sont soumis a des restrictions de delivrabilite (opt-in, qualite). Le message a ete accepte par l'API mais probablement non delivre.

### 3. Erreur `(#100)` pour Aboutou 0546
Le numero `+2250546566646` n'est probablement pas enregistre sur WhatsApp, ou il y a un probleme de format.

## Plan de correction

### Etape 1 : Corriger la verification du retour dans `notify-fund-ready`
```typescript
const waResult = await sendWhatsAppTemplate(...);
if (waResult.success) {
  sentPhones.add(normalizedPhone);
  friendWaSent++;
} else {
  friendWaFailed++;
  console.error(`...`);
}
```

### Etape 2 : Re-deployer et re-tester
- Supprimer les notifications de dedup existantes
- Appeler `notify-fund-ready` avec le fund test
- Verifier les logs et le dashboard Meta

### Fichier modifie
- `supabase/functions/notify-fund-ready/index.ts` : verifier `waResult.success` avant de compter comme envoye

