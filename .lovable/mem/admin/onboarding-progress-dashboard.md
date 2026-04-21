---
name: Admin onboarding progress dashboard
description: Page admin /admin/onboarding affichant l'entonnoir des 6 étapes d'onboarding et la liste des utilisateurs avec leur étape bloquante, pour pousser à la finalisation via relance ciblée.
type: feature
---
La route `/admin/onboarding` (composant `OnboardingProgressDashboard`) permet aux admins de visualiser la progression de chaque utilisateur dans le parcours d'onboarding (6 étapes : Anniversaire, Goûts, Souhaits, Amis, Page & Cagnotte, Partages). KPIs (total, terminés, en cours, abandonnés >7j sans progression), entonnoir cliquable, tableau filtrable (par étape bloquante, pays, statut, recherche). Actions : relance WhatsApp ciblée sur l'étape manquante, voir profil. Export CSV. Données agrégées côté serveur via l'edge function `admin-onboarding-progress` (filtrage régional via `assigned_countries` pour regional_admins). Cache React Query 5 min. La table `profiles.onboarding_furthest_step` est conservée à 6 pour les comptes terminés (backfill effectué) afin d'avoir des stats historiques.
