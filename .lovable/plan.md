

## Obtenir l'API Wave Côte d'Ivoire

Wave propose une API de paiement pour les marchands en Afrique de l'Ouest. Voici les étapes pour obtenir l'accès.

### 1. Créer un compte Wave Business

- Rendez-vous sur le portail développeur Wave : **https://developer.wave.com**
- Ou contactez l'équipe commerciale Wave CI via :
  - Site : **https://www.wave.com/ci/** → section "Entreprises" ou "Développeurs"
  - Email : **developers@wave.com** ou **partners@wave.com**
  - Téléphone : contacter le support Wave CI depuis l'app Wave

### 2. S'inscrire comme marchand/partenaire API

Wave exige généralement :
- **Documents légaux** : RCCM, attestation fiscale, pièce d'identité du dirigeant
- **Informations société** : nom (AMTEY'S SARLU), adresse, activité (marketplace de cadeaux)
- **Volume estimé** : nombre de transactions mensuelles prévues
- **Description du cas d'usage** : paiement e-commerce, split vendeur/plateforme

### 3. Obtenir les clés API

Une fois approuvé, Wave fournit :
- **API Key** (clé secrète pour les appels serveur)
- **Webhook Secret** (pour valider les notifications de paiement)
- Un environnement **sandbox** pour tester avant la production

### 4. Fonctionnalités principales de l'API Wave

| Endpoint | Usage |
|----------|-------|
| **Checkout** | Créer une session de paiement avec redirection |
| **Transfer** | Envoyer de l'argent vers un numéro Wave |
| **Webhook** | Recevoir les confirmations de paiement |

### 5. Intégration dans JOIE DE VIVRE

Une fois les clés obtenues :
- Stocker `WAVE_API_KEY` et `WAVE_WEBHOOK_SECRET` dans les secrets Supabase
- Remplacer le mode simulation actuel (`WavePaymentSimulation`) par de vrais appels API Wave Checkout
- Configurer le webhook pour confirmer automatiquement les commandes

### Liens utiles

- Documentation API Wave : **https://developer.wave.com/docs**
- Guide d'intégration checkout : **https://docs.wave.com/api/checkout**

Ce n'est pas une tache de code -- c'est une démarche administrative auprès de Wave. Une fois les clés API en main, je pourrai intégrer le vrai flux de paiement dans l'application.

