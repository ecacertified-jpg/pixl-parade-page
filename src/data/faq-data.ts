/**
 * FAQ Data - Source unique de vérité
 * Utilisé par le composant FAQ.tsx et le script de génération Markdown
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  iconName: string;
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    id: "account",
    title: "Compte et Inscription",
    iconName: "User",
    items: [
      {
        question: "Comment créer un compte ?",
        answer: "Vous pouvez créer un compte en cliquant sur « S'inscrire » depuis la page d'accueil. Vous pouvez vous inscrire avec votre adresse email ou via votre compte Google. Un email de confirmation vous sera envoyé pour activer votre compte.",
      },
      {
        question: "Comment modifier mes informations personnelles ?",
        answer: "Connectez-vous à votre compte, puis accédez à « Paramètres du profil » depuis le menu. Vous pourrez y modifier votre nom, photo de profil, date d'anniversaire, numéro de téléphone et autres informations.",
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Pour supprimer votre compte, veuillez contacter notre support à contact@joiedevivre-africa.com. Notez que la suppression est définitive et entraînera la perte de toutes vos données, contributions et historique.",
      },
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe.",
      },
    ],
  },
  {
    id: "funds",
    title: "Cagnottes Collectives",
    iconName: "Gift",
    items: [
      {
        question: "Comment créer une cagnotte ?",
        answer: "Depuis votre tableau de bord, cliquez sur le bouton « + » puis « Créer une cagnotte ». Renseignez le titre, la description, le montant objectif, la date limite et le bénéficiaire. Vous pouvez aussi lier un produit de la boutique à votre cagnotte.",
      },
      {
        question: "Comment contribuer à une cagnotte ?",
        answer: "Vous pouvez contribuer via le lien de partage reçu ou en accédant directement à la page de la cagnotte. Cliquez sur « Contribuer », choisissez le montant et procédez au paiement via Orange Money, MTN Mobile Money ou Wave.",
      },
      {
        question: "Puis-je faire une contribution anonyme ?",
        answer: "Oui ! Lors de votre contribution, vous avez l'option « Contribuer anonymement ». Votre nom ne sera pas affiché aux autres participants, mais le créateur de la cagnotte pourra voir votre contribution pour des raisons de suivi.",
      },
      {
        question: "Comment organiser une cagnotte surprise ?",
        answer: "Lors de la création de la cagnotte, activez l'option « Surprise ». Définissez une date de révélation et un message personnalisé. Le bénéficiaire ne verra pas la cagnotte jusqu'à la date choisie, où il recevra une notification spéciale.",
      },
      {
        question: "Que se passe-t-il si l'objectif n'est pas atteint ?",
        answer: "Les fonds collectés restent disponibles même si l'objectif n'est pas atteint. Vous pouvez utiliser le montant collecté pour acheter un cadeau de valeur équivalente dans la boutique ou prolonger la durée de la cagnotte.",
      },
      {
        question: "Comment partager ma cagnotte ?",
        answer: "Depuis la page de votre cagnotte, cliquez sur « Partager ». Vous pouvez copier le lien, l'envoyer par WhatsApp, SMS ou email. Chaque cagnotte dispose d'un lien unique sécurisé.",
      },
    ],
  },
  {
    id: "payments",
    title: "Paiements et Transactions",
    iconName: "CreditCard",
    items: [
      {
        question: "Quels moyens de paiement acceptez-vous ?",
        answer: "Nous acceptons Orange Money, MTN Mobile Money et Wave. Ces moyens de paiement sont sécurisés et largement utilisés en Côte d'Ivoire. Les paiements par carte bancaire seront bientôt disponibles.",
      },
      {
        question: "Comment obtenir un remboursement ?",
        answer: "Pour demander un remboursement, contactez notre support dans les 48h suivant votre transaction. Les remboursements sont traités sous 5 à 7 jours ouvrables après validation. Notez que les contributions aux cagnottes ne sont généralement pas remboursables.",
      },
      {
        question: "Mes paiements sont-ils sécurisés ?",
        answer: "Oui, toutes les transactions sont cryptées et sécurisées. Nous ne stockons pas vos informations de paiement complètes. Chaque transaction passe par les serveurs sécurisés de nos partenaires de paiement (Orange, MTN, Wave).",
      },
      {
        question: "Y a-t-il des frais de transaction ?",
        answer: "Des frais minimes peuvent s'appliquer selon le moyen de paiement utilisé. Ces frais sont affichés avant la confirmation de votre paiement. La plateforme JOIE DE VIVRE ne prélève pas de commission sur les cagnottes.",
      },
    ],
  },
  {
    id: "shop",
    title: "Boutique et Commandes",
    iconName: "ShoppingBag",
    items: [
      {
        question: "Comment passer une commande ?",
        answer: "Parcourez la boutique, sélectionnez un produit et ajoutez-le au panier. Procédez au paiement en renseignant l'adresse de livraison et le numéro du bénéficiaire. Vous recevrez une confirmation par notification.",
      },
      {
        question: "Comment suivre ma commande ?",
        answer: "Accédez à la section « Mes commandes » depuis votre profil. Vous y verrez le statut de chaque commande : en attente, confirmée, en préparation, en livraison ou livrée. Vous recevrez aussi des notifications à chaque étape.",
      },
      {
        question: "Quels sont les délais de livraison ?",
        answer: "Les délais varient selon le vendeur et la zone de livraison. En général, comptez 24 à 72 heures pour Abidjan et ses environs. Les délais exacts sont indiqués sur la fiche produit de chaque article.",
      },
      {
        question: "Comment devenir vendeur sur la plateforme ?",
        answer: "Cliquez sur « Espace Vendeur » depuis la page d'accueil et créez votre compte professionnel. Remplissez les informations de votre entreprise, ajoutez vos produits et attendez la validation de notre équipe (sous 48h).",
      },
      {
        question: "Puis-je annuler une commande ?",
        answer: "Vous pouvez annuler une commande tant qu'elle n'a pas été confirmée par le vendeur. Une fois confirmée, contactez directement le vendeur ou notre support pour discuter des options possibles.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Rappels et Notifications",
    iconName: "Bell",
    items: [
      {
        question: "Comment activer les rappels d'anniversaire ?",
        answer: "Ajoutez vos contacts avec leur date d'anniversaire depuis la section « Mes contacts ». Les rappels seront automatiquement envoyés 7 jours, 3 jours et le jour même de l'anniversaire. Vous pouvez personnaliser ces délais dans les paramètres.",
      },
      {
        question: "Comment désactiver les notifications ?",
        answer: "Accédez à « Paramètres de notification » depuis votre profil. Vous pouvez désactiver toutes les notifications ou choisir celles que vous souhaitez recevoir : rappels, contributions, messages, etc.",
      },
      {
        question: "Puis-je recevoir des notifications par WhatsApp ?",
        answer: "Oui ! Dans les paramètres de notification, activez l'option WhatsApp et renseignez votre numéro. Vous recevrez les rappels importants directement sur WhatsApp en plus des notifications dans l'application.",
      },
      {
        question: "Comment ajouter un événement personnalisé ?",
        answer: "Depuis la fiche d'un contact, cliquez sur « Ajouter un événement ». Vous pouvez créer des rappels pour les mariages, promotions, fêtes et toute autre occasion importante avec une date récurrente ou unique.",
      },
    ],
  },
  {
    id: "support",
    title: "Contact et Support",
    iconName: "HelpCircle",
    items: [
      {
        question: "Comment contacter le support ?",
        answer: "Vous pouvez nous contacter par email à contact@joiedevivre-africa.com, par téléphone au +225 05 465 666 46, ou via le chat intégré à l'application (icône en bas à droite de l'écran).",
      },
      {
        question: "Quels sont vos horaires de support ?",
        answer: "Notre équipe support est disponible du lundi au vendredi, de 8h à 18h (heure d'Abidjan). Les demandes reçues en dehors de ces horaires seront traitées le jour ouvrable suivant.",
      },
      {
        question: "Comment signaler un problème technique ?",
        answer: "Décrivez le problème rencontré avec le plus de détails possible (écran concerné, message d'erreur, etc.) et envoyez-le à contact@joiedevivre-africa.com. Des captures d'écran nous aideront à résoudre le problème plus rapidement.",
      },
      {
        question: "Comment signaler un contenu inapproprié ?",
        answer: "Sur chaque publication ou profil, vous trouverez une option « Signaler ». Sélectionnez la raison du signalement et notre équipe de modération examinera le contenu sous 24h.",
      },
    ],
  },
];

export const FAQ_METADATA = {
  lastUpdated: "Janvier 2026",
  contactEmail: "contact@joiedevivre-africa.com",
  contactPhone: "+225 05 465 666 46",
};
