

## Ajout de logs detailles sur les echecs de templates WhatsApp

### Objectif

Quand un appel a `sendWhatsAppTemplate` echoue (erreur API ou erreur reseau), loguer le numero formate, le nom du template, les parametres body et button envoyes pour faciliter le diagnostic.

### Fichier modifie : `supabase/functions/_shared/sms-sender.ts`

### Modifications dans `sendWhatsAppTemplate`

**1. Log d'erreur API enrichi (bloc `if (!response.ok)`)** — ligne ~350

Ajouter apres le `console.error` existant un log supplementaire avec :
- Le numero formate (masque partiellement : 6 premiers + ***)
- Le nom du template
- Le code langue
- Les parametres body (tableau complet)
- Les parametres button (tableau complet)
- Le code d'erreur et sous-code Meta si presents dans la reponse

Exemple de sortie :
```text
[WhatsApp Template] DETAIL -> to: "22507***", template: "joiedevivre_group_contribution", lang: "fr", body: ["Ami(e)","Bilal","50000","Gateau"], buttons: ["abc-uuid"], error_code: 100, error_subcode: 2494010
```

**2. Log d'erreur reseau enrichi (bloc `catch`)** — ligne ~370

Meme enrichissement pour les erreurs reseau (timeout, DNS, etc.) afin d'avoir les parametres dans les logs meme sans reponse API.

### Impact

- Aucun changement frontend
- Aucune nouvelle dependance
- Les numeros sont partiellement masques (6 premiers chiffres + ***) pour la securite
- Redeploy automatique de toutes les Edge Functions utilisant le module partage

