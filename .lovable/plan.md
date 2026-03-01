

# Section "Statut Meta WhatsApp" dans le dashboard admin

## Objectif

Ajouter une section informative en haut de la page `/admin/whatsapp-otp` (ou en tant que nouvelle page dediee) affichant clairement le mode actuel de l'application Meta (Developpement vs Production) et une checklist des actions requises pour passer en production.

## Approche

Plutot que creer une page separee, ajouter un composant `WhatsAppMetaStatus` directement dans la page `WhatsAppOtpAnalytics.tsx`, au-dessus du dashboard existant. Cette approche est coherente car c'est la page ou l'admin consulte deja les statistiques WhatsApp.

## Modifications

### 1. Nouveau composant `src/components/admin/WhatsAppMetaStatus.tsx`

Un composant informatif de type "carte statut" qui affiche :

- **Indicateur de mode** : badge colore "Developpement" (orange/warning) ou "Production" (vert/succes), stocke dans une variable d'environnement `VITE_META_APP_MODE` (valeur par defaut : `development`)
- **Checklist des actions requises** pour passer en production :
  1. Creer un compte Meta Business verifie
  2. Associer un numero de telephone verifie au compte WhatsApp Business
  3. Soumettre l'app pour revue Meta avec video de demonstration
  4. Obtenir les permissions `whatsapp_business_messaging` et `whatsapp_business_management`
  5. Activer le mode "En ligne" dans les parametres de l'app
  6. Configurer un moyen de paiement actif pour les conversations WhatsApp
- **Informations de configuration actuelles** (en lecture seule) :
  - Phone Number ID : `1051948151326455`
  - Namespace : `joiedevivre`
  - URL du webhook
- **Liens utiles** vers la documentation Meta et le Business Manager

Le composant utilisera les composants existants : `Card`, `Badge`, `Alert`, et les icones Lucide (`Shield`, `CheckCircle2`, `Circle`, `ExternalLink`).

### 2. Mise a jour de `src/pages/Admin/WhatsAppOtpAnalytics.tsx`

Importer et placer le nouveau composant entre `AdminCountryRestrictionAlert` et `WhatsAppOtpDashboard`.

### 3. Variable d'environnement (optionnelle)

Ajouter `VITE_META_APP_MODE=development` dans `.env` pour controler l'affichage du badge. Quand l'app passera en production, il suffira de changer cette valeur en `production` pour que le badge devienne vert.

## Details techniques

- Le composant est purement informatif (pas d'appel API) -- il utilise des donnees statiques et la variable d'environnement
- La checklist utilise des icones `CheckCircle2` (vert) pour les etapes deja completees et `Circle` (gris) pour celles restantes
- Les etapes completees par defaut : creation du compte Meta Business, association du numero, configuration du webhook
- Les etapes restantes : soumission pour revue, activation du mode en ligne, paiement actif
- Un bouton "Ouvrir Meta Business Manager" avec lien externe vers `https://business.facebook.com/`
- Composant repliable (Collapsible) pour ne pas encombrer la page quand tout est OK

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/admin/WhatsAppMetaStatus.tsx` | Nouveau composant |
| `src/pages/Admin/WhatsAppOtpAnalytics.tsx` | Import et placement |
| `.env` | Ajout de `VITE_META_APP_MODE` |

