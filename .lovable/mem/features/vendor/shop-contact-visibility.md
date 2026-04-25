---
name: shop-contact-visibility
description: Les coordonnées du prestataire (téléphone, email, site web) sont publiques sur sa page boutique /b/:businessId, avec repli vers le support JOIE DE VIVRE si elles sont absentes
type: feature
---

Sur la page boutique publique (`/b/:businessId`, composant `VendorShop.tsx`), la carte « Support & Infos » (`VendorContactCard`) affiche le téléphone et l'email du prestataire **uniquement** si celui-ci a explicitement activé la visibilité dans ses paramètres (`/business-profile-settings`).

**Toggles côté prestataire** (table `business_accounts`) :
- `show_phone_publicly` (boolean, défaut `false`)
- `show_email_publicly` (boolean, défaut `false`)

Ces toggles sont rendus en `Switch` shadcn sous chaque champ « Email professionnel » et « Téléphone » dans `BusinessProfileSettings.tsx`. Le switch est désactivé tant que le champ correspondant est vide. À l'enregistrement, on force `false` si la valeur est vide pour éviter un état incohérent.

**Application de la règle** : portée par la vue publique `business_public_info` via
`CASE WHEN show_phone_publicly THEN phone ELSE NULL END` (idem pour `email`). Cela garantit que les coordonnées masquées ne quittent jamais la BDD côté public, même si un attaquant manipule le client.

**Repli côté UI** : si la vue retourne `phone`/`email` à `null`, `VendorShop.tsx` retombe sur les coordonnées de support JOIE DE VIVRE (`countryConfig.legalEntity.phone/email`) pour que le visiteur ait toujours un canal de contact.

**Site web** : `website_url` n'a pas de toggle — il est public dès qu'il est renseigné (un site web est par nature publié).

**Mise en page** : téléphone et email sont rendus en `col-span-2` (pleine largeur) dans la grille de la carte pour éviter la troncature des numéros internationaux et des adresses email longues sur mobile.