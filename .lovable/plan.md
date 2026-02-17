

# Configuration WhatsApp OTP pour CI et BJ

## Contexte

Actuellement, la Cote d'Ivoire n'offre que le SMS (Twilio) et le Benin que WhatsApp. L'objectif est de proposer le choix SMS ou WhatsApp pour la CI, tout en ameliorant la delivrabilite WhatsApp pour les deux pays en utilisant un template OTP officiel Meta.

## Etape 1 : Activer le choix WhatsApp pour la Cote d'Ivoire

**Fichier** : `src/config/countries.ts`

Modifier la configuration CI pour proposer les deux canaux :

| Champ | Avant | Apres |
|-------|-------|-------|
| smsReliability | `reliable` | `unreliable` |
| whatsappFallbackEnabled | `false` | `true` |

En passant a `unreliable`, le composant `OtpMethodSelector` s'affichera et proposera SMS et WhatsApp aux utilisateurs ivoiriens. Le SMS restera fonctionnel (Twilio), mais l'utilisateur pourra choisir WhatsApp s'il le prefere.

## Etape 2 : Migrer la Edge Function vers le template OTP WhatsApp

**Fichier** : `supabase/functions/send-whatsapp-otp/index.ts`

Le code actuel envoie un message texte libre. Cela pose deux problemes :
- Necessite une fenetre d'interaction de 24h (l'utilisateur doit avoir ecrit en premier)
- Taux de delivrabilite plus faible

La modification consiste a utiliser le format **template HSM** (Highly Structured Message) de Meta, qui :
- Peut etre envoye a tout moment sans fenetre d'interaction
- A un taux de delivrabilite de ~99%
- Affiche un bouton "Copier le code" natif dans WhatsApp

```text
Avant (message texte libre) :
{
  type: "text",
  text: { body: "Votre code est 123456..." }
}

Apres (template OTP) :
{
  type: "template",
  template: {
    name: "joiedevivre_otp",
    language: { code: "fr" },
    components: [{
      type: "body",
      parameters: [{ type: "text", text: "123456" }]
    }, {
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: "123456" }]
    }]
  }
}
```

La fonction conservera un **fallback** vers le message texte simple si le template echoue (ex: template pas encore approuve).

## Etape 3 : Creer le template dans Meta Business Manager

Cette etape doit etre faite manuellement par vous dans Meta Business Manager. Voici les instructions :

1. Aller sur https://business.facebook.com > WhatsApp Manager > Message Templates
2. Creer un nouveau template :
   - **Nom** : `joiedevivre_otp`
   - **Categorie** : `Authentication` (ou `AUTHENTICATION`)
   - **Langue** : Francais (`fr`)
3. Configurer le corps du message :
   - Texte : `Votre code de verification Joie de Vivre est {{1}}. Il expire dans 5 minutes.`
   - Le parametre `{{1}}` sera remplace par le code OTP
4. Ajouter un bouton "Copier le code" (optionnel mais recommande)
5. Soumettre pour approbation Meta (generalement approuve en quelques minutes pour les templates OTP)

## Etape 4 : Ajuster le label dans l'OtpMethodSelector pour la CI

**Fichier** : `src/components/auth/OtpMethodSelector.tsx`

Pour la CI ou le SMS est fiable, ne pas afficher "(peut etre lent)" a cote du bouton SMS. La mention `unreliable` dans la config sert uniquement a activer le selecteur, pas a indiquer un probleme reel avec le SMS en CI.

Ajouter une logique pour differencier "unreliable par choix" (CI) de "vraiment unreliable" (SN) afin d'afficher le bon libelle.

## Resume des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/config/countries.ts` | CI : smsReliability `unreliable`, whatsappFallbackEnabled `true` |
| `supabase/functions/send-whatsapp-otp/index.ts` | Migrer vers template OTP + fallback texte |
| `src/components/auth/OtpMethodSelector.tsx` | Ajuster les labels pour la CI |

## Section technique

- La Edge Function detectera automatiquement si le template fonctionne et basculera sur le message texte en cas d'echec
- Le Benin reste en WhatsApp uniquement (SMS `unavailable`)
- La CI propose les deux options avec SMS comme choix par defaut
- Aucune migration de base de donnees necessaire (la table `whatsapp_otp_codes` existe deja)
- Les secrets WhatsApp sont deja configures dans Supabase
