
## Ajouter l'envoi WhatsApp `joiedevivre_group_contribution` dans le flux de creation de cagnotte business

### Probleme identifie

Quand une cagnotte business est creee (via `BusinessCollaborativeGiftModal`), le code appelle la fonction Edge **`notify-business-fund-friends`**, qui ne cree que des notifications `push` et `in_app`. **Aucun WhatsApp n'est envoye.**

La fonction `notify-business-fund-contributors` (qui contient le code WhatsApp) existe mais n'est **jamais appelee** dans ce flux.

### Solution

Integrer l'envoi du template WhatsApp `joiedevivre_group_contribution` directement dans `notify-business-fund-friends`, en suivant le pattern WhatsApp-first existant.

### Modifications

#### 1. `supabase/functions/notify-business-fund-friends/index.ts`

- Importer `sendWhatsAppTemplate` depuis `../_shared/sms-sender.ts`
- Apres la creation des notifications in-app (ligne 140), ajouter un bloc qui :
  1. Recupere les profils (first_name, phone) des amis identifies dans `friendIds`
  2. Pour chaque ami ayant un numero de telephone, envoie le template WhatsApp `joiedevivre_group_contribution` avec les parametres :
     - `[0]` : prenom de l'ami
     - `[1]` : nom du beneficiaire
     - `[2]` : montant objectif formate (ex: "88 000")
     - `[3]` : nom du produit
  3. Passe le `fund_id` comme parametre de bouton CTA (pour le lien `/f/{fund_id}`)
- Ajouter le compteur `whatsapp_sent` dans la reponse JSON

#### 2. Verification et deploiement

- Redeployer la fonction `notify-business-fund-friends`
- Tester en appelant manuellement la fonction avec le fund_id de Francoise (`c694c0d0-2bbe-446d-91de-47d2549b3be3`)
- Verifier les logs et la table `scheduled_notifications`

### Details techniques

Le code WhatsApp a ajouter suit exactement le meme pattern que dans `notify-business-fund-contributors` (lignes 170-195) :

```text
// Get friends' phone numbers
const { data: friendProfiles } = await supabase
  .from('profiles')
  .select('user_id, first_name, phone')
  .in('user_id', friendIds);

const formattedTarget = target_amount?.toLocaleString('fr-FR') || '0';
let whatsappSentCount = 0;

for (const friend of (friendProfiles || [])) {
  if (!friend.phone) continue;
  try {
    const result = await sendWhatsAppTemplate(
      friend.phone,
      'joiedevivre_group_contribution',
      'fr',
      [friend.first_name || 'Ami(e)', beneficiaryName, formattedTarget, product_name],
      [fund_id]
    );
    if (result.success) whatsappSentCount++;
  } catch (e) {
    console.error(`WhatsApp error for ${friend.user_id}:`, e);
  }
}
```

### Impact

- Les amis du beneficiaire avec `can_see_funds = true` et un numero de telephone recevront le template WhatsApp
- Les amis sans numero continueront a recevoir uniquement les notifications push/in-app
- Aucune modification cote frontend necessaire
