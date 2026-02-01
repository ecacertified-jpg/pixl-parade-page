
# Ajout de la Fonctionnalite de Duplication de Produit pour l'Admin

## Objectif

Permettre aux administrateurs de dupliquer rapidement un produit existant dans les modales "Gerer les Produits" et "Ajouter un Produit". Cela accelere la creation de produits similaires en pre-remplissant toutes les informations du produit source.

## Fonctionnement Utilisateur

### Dans AdminProductsModal (Gerer les Produits)

Au survol d'un produit, l'admin verra deux boutons au lieu d'un seul :
- **Modifier** (existant) : Ouvre le formulaire d'edition
- **Dupliquer** (nouveau) : Ouvre le formulaire d'ajout pre-rempli avec les donnees du produit

```text
┌────────────────────────────────────────┐
│  [Image produit]                       │
│  ┌──────────────┐ ┌──────────────────┐ │
│  │ 📋 Dupliquer │ │ ✏️ Modifier      │ │
│  └──────────────┘ └──────────────────┘ │
│  Chaussures hybrides noires            │
│  42 000 F           Stock: 10          │
└────────────────────────────────────────┘
```

### Dans AdminAddProductModal (Ajouter un Produit)

Si un produit source est fourni, le formulaire est pre-rempli avec :
- Le nom modifie : "Copie de [Nom original]"
- La description du produit original
- Le prix et le stock
- La categorie
- Les parametres d'experience (si applicable)
- Les images (copiees par reference)
- Les videos (copiees par reference)
- Statut actif/inactif

## Modifications Techniques

### 1. AdminProductsModal.tsx

Ajouter un nouvel etat et bouton de duplication :

```text
Modifications :
- Ajouter un etat `duplicatingProduct` pour stocker le produit a dupliquer
- Ajouter un bouton "Dupliquer" a cote de "Modifier" dans l'overlay au survol
- Passer `duplicateFromProduct` en prop a AdminAddProductModal
```

### 2. AdminAddProductModal.tsx

Accepter une nouvelle prop pour pre-remplir le formulaire :

```text
Nouvelles props :
- `duplicateFromProduct?: Product` : Produit source a dupliquer

Comportement :
- Si duplicateFromProduct est fourni, pre-remplir formData avec les valeurs
- Pre-remplir productImages avec les images existantes (en mode reference)
- Pre-remplir productVideos avec les videos existantes (en mode reference)
- Modifier le titre en "Dupliquer un produit (Admin)"
- Ajouter "Copie de " au debut du nom
```

## Diagramme de Flux

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AdminProductsModal                            │
│                                                                  │
│  ┌──────────────┐                                                │
│  │ Liste des    │                                                │
│  │ produits     │                                                │
│  └──────┬───────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────┐                    │
│  │ Au survol                                │                    │
│  │  ┌────────────┐    ┌─────────────┐       │                    │
│  │  │ Dupliquer  │    │ Modifier    │       │                    │
│  │  └─────┬──────┘    └──────┬──────┘       │                    │
│  └────────┼──────────────────┼──────────────┘                    │
│           │                  │                                   │
│           ▼                  ▼                                   │
│  ┌────────────────┐  ┌────────────────┐                          │
│  │ AdminAdd       │  │ AdminEdit      │                          │
│  │ ProductModal   │  │ ProductModal   │                          │
│  │ (pre-rempli)   │  │                │                          │
│  └────────────────┘  └────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Interface Product a Dupliquer

Les champs copies lors de la duplication :

| Champ | Copie | Modification |
|-------|-------|--------------|
| name | Oui | Prefixe "Copie de " |
| description | Oui | Identique |
| price | Oui | Identique |
| stock_quantity | Oui | Identique |
| category_id | Oui | Identique |
| is_experience | Oui | Identique |
| experience_type | Oui | Identique |
| location_name | Oui | Identique |
| is_active | Oui | Identique |
| image_url | Oui | Reference URL |
| images | Oui | References URLs |
| videos | Oui | References URLs |
| business_account_id | Oui | Identique (meme boutique) |

## Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/admin/AdminProductsModal.tsx` | Ajouter bouton Dupliquer, etat duplicatingProduct, passer prop a AdminAddProductModal |
| `src/components/admin/AdminAddProductModal.tsx` | Ajouter prop duplicateFromProduct, logique de pre-remplissage, titre dynamique |

## Details d'Implementation

### AdminProductsModal.tsx

1. Importer l'icone `Copy` de lucide-react
2. Ajouter un etat : `const [duplicatingProduct, setDuplicatingProduct] = useState<Product | null>(null);`
3. Modifier l'overlay au survol pour inclure deux boutons
4. Passer `duplicateFromProduct={duplicatingProduct}` a AdminAddProductModal
5. Reinitialiser duplicatingProduct quand le modal se ferme

### AdminAddProductModal.tsx

1. Ajouter la prop : `duplicateFromProduct?: Product`
2. Dans useEffect, si duplicateFromProduct est fourni :
   - Pre-remplir formData avec les valeurs du produit source
   - Charger les images existantes dans productImages
   - Charger les videos existantes dans productVideos
3. Modifier le titre du dialog si duplication
4. Ajouter "Copie de " au nom du produit
5. Reinitialiser lors de la fermeture

## Avantages

- **Gain de temps** : Dupliquer un produit similaire en quelques clics
- **Reduction d'erreurs** : Pas besoin de ressaisir les informations
- **Conservation des medias** : Images et videos sont reutilisees (pas de re-upload)
- **Audit** : L'action de creation est loggee normalement

## Edge Cases Geres

- Si le produit source n'a pas d'images/videos, les champs restent vides
- Le nouveau produit aura un nouvel ID unique
- Les timestamps (created_at, updated_at) seront nouveaux
- L'admin peut modifier toutes les valeurs avant de sauvegarder
