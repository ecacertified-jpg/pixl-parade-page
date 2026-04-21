---
name: Admin fund detail page
description: Page admin /admin/funds/:fundId affichant la fiche détaillée d'une cagnotte (créateur, bénéficiaire, contributions, actions). Cible des notifications WhatsApp template joiedevivre_admin_fund_created.
type: feature
---
La route `/admin/funds/:fundId` (composant `AdminFundDetail`) affiche la fiche complète d'une cagnotte : titre, occasion, montants (objectif/collecté/restant), barre de progression, statut, créateur (nom, téléphone, ville, pays), bénéficiaire (contact ou auto-bénéficiaire), message surprise, et liste détaillée des contributions avec montants, messages et noms des contributeurs. Filtrage régional appliqué via `canAccessCountry` du hook `useAdmin` : un regional_admin ne voit que les funds des pays auxquels il est affecté. Actions disponibles : ouvrir la page publique `/f/:share_token`, contacter le créateur via WhatsApp, voir le profil du créateur dans `/admin/users`. Cette route est la cible du bouton CTA "Ouvrir le dashboard" du template WhatsApp `joiedevivre_admin_fund_created` envoyé par l'edge function `notify-admins-fund-created`.
