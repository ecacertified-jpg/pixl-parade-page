# JOIE DE VIVRE - Connaissance du Projet

## Vue d'ensemble
JOIE DE VIVRE est une application mobile e-commerce qui célèbre les moments heureux (anniversaires, réussites académiques, promotions professionnelles, mariages) en proposant des articles ciblés. L'application vise principalement les jeunes femmes urbaines et les couples en Côte d'Ivoire avec une expérience émotionnelle et interactive via des notifications personnalisées.

## Architecture Technique

### Stack Technologique
- **Frontend**: React 18.3.1 avec TypeScript
- **Framework**: Vite pour le build et développement
- **Styling**: Tailwind CSS avec design system personnalisé
- **Components**: Radix UI pour les composants accessibles
- **Backend**: Supabase (authentification, base de données, RLS)
- **Routing**: React Router DOM
- **State Management**: React Query pour les requêtes serveur
- **Icons**: Lucide React

### Base de Données (Supabase)
#### Tables Principales
- `contacts` - Gestion des contacts/amis avec anniversaires
- `contact_events` - Événements liés aux contacts (anniversaires, occasions)
- `gifts` - Historique des cadeaux donnés/reçus
- `user_favorites` - Articles favoris des utilisateurs
- `products` - Catalogue produits
- `categories` - Catégories d'articles
- `collective_funds` - Cagnottes collectives pour cadeaux
- `payment_transactions` - Transactions de paiement
- `notifications` - Système de notifications

#### Sécurité
- Row Level Security (RLS) activé sur toutes les tables
- Politiques d'accès basées sur `auth.uid()`
- Isolation des données utilisateur

## Fonctionnalités Implémentées

### 1. Authentification
- **Localisation**: `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`
- **Fonctionnalités**:
  - Inscription/connexion par email/mot de passe
  - Support Google Authentication
  - Modal de profil post-inscription automatique
  - Collecte d'informations utilisateur (téléphone, date de naissance, lieu)

### 2. Navigation et Layout
- **Navigation principale**: Menu du bas (Accueil, Boutique, Cadeaux, Favoris)
- **Navigation supérieure**: Panier, Notifications, Profil
- **Responsive design**: Optimisé mobile-first

### 3. Page d'Accueil (`src/pages/Index.tsx`)
- **Composants**:
  - `NotificationCard` - Alertes anniversaires
  - `WelcomeSection` - Accueil personnalisé
  - `ActionCard` - Actions rapides (Dashboard, Offrir cadeau)
  - `FavoriteArticlesSection` - Articles favoris
  - `OccasionSection` - Occasions spéciales
  - `PopularCategoriesSection` - Catégories populaires
  - `CollaborativeOfferSection` - Offres collaboratives

### 4. Dashboard Utilisateur (`src/pages/Dashboard.tsx`)
- **Sections**:
  - Profil utilisateur
  - Gestion des contacts/donateurs
  - Historique des cadeaux
  - Paramètres compte professionnel
  - Notifications programmées

### 5. Système de Favoris
- **Localisation**: `src/pages/Favorites.tsx`
- **Fonctionnalités**:
  - Gestion favoris personnels
  - Visibilité favoris des amis
  - Suggestions basées sur favoris
  - Intégration processus d'achat cadeau

### 6. Boutique (`src/pages/Shop.tsx`)
- **Fonctionnalités**:
  - Recherche produits avec filtres
  - Sélection géographique pour livraison
  - Catégories dynamiques
  - Modal de commande avec options:
    - "Pour moi-même"
    - "Offrir en cadeau" avec sous-options:
      - Offrir à quelqu'un (voir favoris amis)
      - Cotisation groupée

### 7. Gestion des Cadeaux (`src/pages/Gifts.tsx`)
- **Fonctionnalités**:
  - Historique complet des cadeaux
  - Filtrage par statut et période
  - Détails des transactions
  - Suivi des livraisons

### 8. Système de Notifications
- **Types**: Anniversaires, événements, recommandations
- **Programmation**: 7-10 jours avant événements
- **Animations visuelles**: Créer joie et bonheur

### 9. Comptes Professionnels (`src/pages/BusinessAccount.tsx`)
- **Fonctionnalités**:
  - Upload images produits
  - Gestion commandes et livraisons
  - Paramètres de retrait sur site
  - Gestion des revenus

## Design System

### Couleurs Sémantiques (HSL)
- Gradients primaires pour l'identité visuelle
- Tokens de couleur cohérents (--primary, --secondary, etc.)
- Support dark/light mode
- Animations fluides avec transitions

### Composants UI
- Base Radix UI avec customisation
- Variants multiples pour chaque composant
- Accessibilité complète
- Design mobile-first responsive

## Fonctionnalités Métier

### Célébration d'Occasions
- **Anniversaires**: Notifications automatiques, suggestions cadeaux
- **Couples**: Anniversaires de mariage, renforcement liens
- **Événements saisonniers**: Noël, Nouvel An, Saint-Valentin, Pâques
- **Réussites**: Académiques, professionnelles

### Système de Cagnottes
- **Cagnottes collectives**: Plusieurs contributeurs pour un cadeau
- **Partage sécurisé**: Tokens de partage
- **Gestion transparente**: Suivi contributions en temps réel

### Livraison et Retrait
- **Géolocalisation**: Sélection zone de livraison
- **Options flexibles**: 
  - Retrait sur site (gratuit)
  - Livraison (payante si > 25,000 FCFA)
- **Communication**: Contact automatique fournisseur/client

## Sécurité et Performance

### Sécurité
- **RLS Supabase**: Isolation complète des données
- **Authentification**: Tokens sécurisés
- **Validation**: Schémas Zod pour les formulaires
- **CORS**: Configuration appropriée

### Performance
- **Lazy loading**: Images et composants
- **React Query**: Cache intelligent des requêtes
- **Code splitting**: Bundles optimisés
- **Compression**: Assets optimisés

## Intégrations Futures

### Notifications Push
- Système programmé pour anniversaires
- Animations émotionnelles
- Multi-canal (email, SMS, push)

### Analytics
- Suivi comportement utilisateur
- Métriques business (conversions, engagement)
- Optimisation continue

### Paiements
- Intégration processeurs locaux
- Support Mobile Money
- Gestion des remboursements

## État Actuel du Projet

### ✅ Complété
- Architecture de base et authentification
- Interface utilisateur complète
- Système de favoris
- Modales de commande
- Navigation fonctionnelle
- Design system cohérent

### 🔄 En cours
- Intégration paiements
- Système de notifications automatiques
- Gestion complète des livraisons

### 📋 À venir
- Tests automatisés
- Déploiement production
- Analytics avancées
- Optimisations performance

## Configuration Développement

### Prérequis
- Node.js 18+
- Compte Supabase configuré
- Variables d'environnement (.env.local)

### Commandes
```bash
npm install
npm run dev
npm run build
npm run preview
```

### Structure Projet
```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   └── *.tsx           # Composants métier
├── pages/              # Pages principales
├── contexts/           # Contextes React
├── hooks/              # Hooks personnalisés
├── integrations/       # Intégrations externes
└── lib/                # Utilitaires
```

## Bonnes Pratiques

### Code
- TypeScript strict mode
- ESLint + Prettier
- Conventions de nommage cohérentes
- Composants fonctionnels avec hooks

### Git
- Commits atomiques
- Messages descriptifs
- Branches par fonctionnalité
- Code review obligatoire

### Documentation
- README à jour
- Commentaires pour logique complexe
- Types TypeScript documentés
- Architecture décisionnelle

---

*Dernière mise à jour: Août 2024*
*Version: 1.0.0*