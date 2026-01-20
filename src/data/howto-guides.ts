/**
 * HowTo Guides Data for Schema.org Structured Data
 * These guides will generate Rich Snippets on Google
 */

import { type HowToSchemaProps } from '@/components/schema/types';

export const howToGuides: HowToSchemaProps[] = [
  {
    id: 'creer-cagnotte',
    name: 'Comment créer une cagnotte collective',
    description: 'Guide étape par étape pour créer une cagnotte et collecter des fonds pour un cadeau commun sur JOIE DE VIVRE.',
    totalTime: 'PT5M',
    steps: [
      {
        name: 'Connectez-vous à votre compte',
        text: "Accédez à votre compte JOIE DE VIVRE. Si vous n'avez pas encore de compte, inscrivez-vous gratuitement avec votre email ou compte Google.",
      },
      {
        name: 'Accédez au tableau de bord',
        text: 'Depuis la page d\'accueil, cliquez sur l\'icône du menu puis sélectionnez "Tableau de bord".',
      },
      {
        name: 'Cliquez sur le bouton Créer',
        text: 'Sur votre tableau de bord, appuyez sur le bouton "+" en bas de l\'écran, puis sélectionnez "Créer une cagnotte".',
      },
      {
        name: 'Renseignez les informations',
        text: 'Remplissez le formulaire avec le titre de la cagnotte, une description, le montant objectif et la date limite de collecte.',
      },
      {
        name: 'Sélectionnez le bénéficiaire',
        text: 'Choisissez le bénéficiaire parmi vos contacts ou ajoutez un nouveau contact avec son nom et sa photo.',
      },
      {
        name: 'Liez un produit (optionnel)',
        text: 'Si vous le souhaitez, sélectionnez un produit de la boutique à associer à votre cagnotte.',
      },
      {
        name: 'Validez et partagez',
        text: 'Confirmez la création et partagez le lien de votre cagnotte par WhatsApp, SMS ou email avec vos proches.',
      },
    ],
    tool: [
      { name: 'Smartphone ou ordinateur' },
      { name: 'Connexion internet' },
    ],
    supply: [
      { name: 'Compte JOIE DE VIVRE' },
      { name: 'Informations du bénéficiaire' },
    ],
  },
  {
    id: 'contribuer-cagnotte',
    name: 'Comment contribuer à une cagnotte',
    description: 'Guide simple pour participer financièrement à une cagnotte collective et aider à offrir un cadeau commun.',
    totalTime: 'PT3M',
    steps: [
      {
        name: 'Ouvrez le lien de la cagnotte',
        text: 'Cliquez sur le lien de partage reçu par WhatsApp, SMS ou email pour accéder à la page de la cagnotte.',
      },
      {
        name: 'Consultez les détails',
        text: "Visualisez le bénéficiaire, l'objectif, le montant déjà collecté et la date limite de la cagnotte.",
      },
      {
        name: 'Cliquez sur Contribuer',
        text: 'Appuyez sur le bouton "Contribuer à cette cagnotte" en bas de la page.',
      },
      {
        name: 'Choisissez le montant',
        text: 'Sélectionnez un montant suggéré ou entrez un montant personnalisé selon votre budget.',
      },
      {
        name: 'Option anonyme (optionnel)',
        text: 'Cochez "Contribuer anonymement" si vous ne souhaitez pas que votre nom apparaisse publiquement.',
      },
      {
        name: 'Procédez au paiement',
        text: 'Choisissez votre moyen de paiement (Orange Money, MTN Mobile Money ou Wave) et confirmez la transaction.',
      },
      {
        name: 'Recevez la confirmation',
        text: 'Après validation, vous recevrez une confirmation par notification. Votre contribution apparaîtra sur la cagnotte.',
      },
    ],
    tool: [
      { name: 'Smartphone' },
      { name: 'Application Mobile Money' },
    ],
    supply: [
      { name: 'Lien de la cagnotte' },
      { name: 'Solde Mobile Money suffisant' },
    ],
  },
  {
    id: 'devenir-vendeur',
    name: 'Comment devenir vendeur sur JOIE DE VIVRE',
    description: 'Guide complet pour créer votre boutique en ligne et vendre vos produits sur la plateforme JOIE DE VIVRE.',
    totalTime: 'PT10M',
    steps: [
      {
        name: "Accédez à l'Espace Vendeur",
        text: 'Depuis la page d\'accueil, cliquez sur "Espace Vendeur" ou "Devenir Vendeur" dans le menu.',
      },
      {
        name: 'Créez votre compte professionnel',
        text: 'Remplissez le formulaire d\'inscription avec votre email professionnel et créez un mot de passe sécurisé.',
      },
      {
        name: 'Renseignez les informations entreprise',
        text: "Entrez le nom de votre entreprise, le type d'activité, l'adresse et les coordonnées de contact.",
      },
      {
        name: 'Ajoutez votre logo et description',
        text: 'Téléchargez le logo de votre boutique et rédigez une description attractive de vos services.',
      },
      {
        name: 'Configurez les zones de livraison',
        text: 'Définissez les zones géographiques que vous couvrez pour la livraison et les tarifs associés.',
      },
      {
        name: 'Ajoutez vos produits',
        text: 'Créez vos fiches produits avec photos, descriptions, prix et quantités en stock.',
      },
      {
        name: 'Attendez la validation',
        text: 'Notre équipe validera votre boutique sous 48h. Vous recevrez une notification de confirmation.',
      },
    ],
    tool: [
      { name: 'Ordinateur ou smartphone' },
      { name: 'Photos de vos produits' },
    ],
    supply: [
      { name: 'Numéro d\'identification fiscale (optionnel)' },
      { name: 'Logo de votre entreprise' },
      { name: 'Catalogue produits' },
    ],
  },
  {
    id: 'organiser-cagnotte-surprise',
    name: 'Comment organiser une cagnotte surprise',
    description: 'Apprenez à créer une cagnotte secrète que le bénéficiaire ne verra qu\'à la date de révélation choisie.',
    totalTime: 'PT7M',
    steps: [
      {
        name: 'Créez une nouvelle cagnotte',
        text: 'Suivez les étapes habituelles de création de cagnotte depuis votre tableau de bord.',
      },
      {
        name: 'Activez le mode Surprise',
        text: 'Dans les options de la cagnotte, activez l\'option "Cagnotte Surprise" en basculant le curseur.',
      },
      {
        name: 'Définissez la date de révélation',
        text: "Choisissez la date et l'heure exactes où le bénéficiaire découvrira la surprise (ex: le jour de son anniversaire).",
      },
      {
        name: 'Rédigez un message personnalisé',
        text: 'Écrivez le message spécial que le bénéficiaire verra lors de la révélation de la surprise.',
      },
      {
        name: 'Invitez les participants discrètement',
        text: 'Partagez le lien uniquement avec les personnes que vous souhaitez faire participer, pas avec le bénéficiaire.',
      },
      {
        name: 'Suivez les contributions',
        text: "Surveillez l'avancement de la collecte dans votre tableau de bord sans que le bénéficiaire ne soit notifié.",
      },
      {
        name: 'Célébration automatique',
        text: 'Le jour J, le bénéficiaire recevra une notification spéciale révélant la cagnotte et tous les contributeurs.',
      },
    ],
    tool: [
      { name: 'Smartphone' },
      { name: 'WhatsApp (pour le partage discret)' },
    ],
  },
];
