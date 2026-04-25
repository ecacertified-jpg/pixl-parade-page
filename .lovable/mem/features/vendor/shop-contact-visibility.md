---
name: shop-contact-visibility
description: Les coordonnées du prestataire (téléphone, email, site web) sont publiques sur sa page boutique /b/:businessId, avec repli vers le support JOIE DE VIVRE si elles sont absentes
type: feature
---

Sur la page boutique publique (`/b/:businessId`, composant `VendorShop.tsx`), la carte « Support & Infos » (`VendorContactCard`) affiche désormais :

- `vendor.phone` et `vendor.email` du prestataire en priorité (cliquables via `tel:` / `mailto:`).
- `vendor.websiteUrl` si renseigné.
- `vendor.address` avec bouton « Voir sur la carte ».

**Règle de repli** : si le prestataire n'a renseigné NI téléphone NI email, on affiche les coordonnées de support JOIE DE VIVRE (`countryConfig.legalEntity.phone/email`) pour que le visiteur ait toujours un canal de contact.

**Mise en page** : téléphone et email sont rendus en `col-span-2` (pleine largeur) dans la grille de la carte pour éviter la troncature des numéros internationaux et des adresses email longues sur mobile.

Cette règle remplace l'ancienne politique qui masquait systématiquement les coordonnées personnelles du prestataire.