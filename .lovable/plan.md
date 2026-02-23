
# Correction WhatsApp : utiliser un template approuve pour les notifications d'ajout de contact

## Probleme identifie

L'API WhatsApp Business de Meta accepte les messages texte libre (`type: "text"`) mais ne les **delivre** au destinataire que si celui-ci a envoye un message au numero Business dans les dernieres 24 heures. Pour les messages inities par l'entreprise (comme une notification d'ajout de contact), un **template pre-approuve** est obligatoire.

C'est pourquoi le SMS arrive (Twilio delivre directement) mais le WhatsApp est "envoye" cote API sans jamais etre recu par le destinataire.

## Solution en 2 etapes

### Etape 1 : Creer un template dans Meta Business Manager (action manuelle)

Aller dans **Meta Business Manager > WhatsApp > Message Templates** et creer un nouveau template :

- **Nom** : `joiedevivre_contact_added`
- **Categorie** : `MARKETING` (ou `UTILITY`)
- **Langue** : `fr` (francais)
- **Corps du message** :

```text
Bonjour ! {{1}} t'a ajoute a son cercle d'amis sur Joie de Vivre !

Ton anniversaire est dans {{2}} jours.

{{3}}
```

Les variables :
- `{{1}}` = nom de l'utilisateur qui ajoute
- `{{2}}` = nombre de jours avant l'anniversaire
- `{{3}}` = appel a l'action (different selon que le contact a un compte ou non)

Soumettre le template pour approbation par Meta (generalement approuve en quelques minutes a quelques heures).

### Etape 2 : Modifier le code pour utiliser le template

#### Fichier 1 : `supabase/functions/_shared/sms-sender.ts`

Ajouter une nouvelle fonction `sendWhatsAppTemplate` qui envoie un message via template au lieu de texte libre :

```typescript
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParameters: string[]
): Promise<SmsResult> {
  // Meme logique de credentials et formatage que sendWhatsApp
  // Mais avec type: "template" au lieu de type: "text"
  // Et les composants body avec les parametres
}
```

#### Fichier 2 : `supabase/functions/notify-contact-added/index.ts`

Remplacer l'appel `sendWhatsApp(contact_phone, whatsappMessage)` par `sendWhatsAppTemplate(...)` avec :
- Template : `joiedevivre_contact_added`
- Parametres : `[userName, daysUntil.toString(), callToAction]`
- Conserver le fallback vers `sendWhatsApp` texte libre en cas d'echec du template

La logique sera :
1. Tenter l'envoi via template (fonctionne meme sans interaction prealable)
2. Si le template echoue (pas encore approuve, etc.), fallback vers texte libre
3. Logger le canal et la methode utilisee dans `birthday_contact_alerts`

## Diagramme du flux

```text
Ajout contact
    |
    v
+-- Preferences utilisateur --+
|                              |
| sms_enabled?     whatsapp_enabled?
|    |                    |
|    v                    v
| sendSms()      sendWhatsAppTemplate()
| (Twilio)       (Meta template approuve)
|    |                    |
|    |              Echec template?
|    |                    |
|    |                    v
|    |           sendWhatsApp() (texte libre)
|    |           (fallback, fonctionne si
|    |            conversation < 24h)
|    |                    |
|    v                    v
+-- Log dans birthday_contact_alerts --+
```

## Impact
- **Fichiers modifies** : 2 (`sms-sender.ts` et `notify-contact-added/index.ts`)
- **Action manuelle requise** : creation du template dans Meta Business Manager
- **Aucune modification de base de donnees** necessaire
- Le SMS continue de fonctionner exactement comme avant
