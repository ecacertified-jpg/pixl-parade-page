

# Ajouter la section WhatsApp Business API dans la Politique de Confidentialite

## Ce qui sera fait

Ajout d'une nouvelle section dediee a l'utilisation de l'API WhatsApp Business de Meta dans la page `/privacy-policy`, requise par Meta pour la validation de l'application.

## Modifications

### 1. Nouvelle section "WhatsApp Business API" (section 4bis, avant le partage actuel)

La section sera inseree entre la section 3 (Utilisation) et la section 4 (Partage), ce qui decalera la numerotation des sections suivantes (4 devient 5, etc., jusqu'a 12 sections au total).

**Contenu de la section :**
- Mention explicite de l'utilisation de l'API WhatsApp Business fournie par Meta Platforms, Inc.
- Donnees partagees avec Meta : numero de telephone de l'utilisateur
- Finalites : verification OTP, rappels d'anniversaire, notifications de commandes, confirmations de contributions aux cagnottes
- Mention que Meta traite ces donnees selon sa propre politique de confidentialite (lien vers https://www.whatsapp.com/legal/privacy-policy)
- Lien vers la page `/data-deletion` pour exercer le droit de suppression
- Precision que l'utilisateur peut se desinscrire des notifications WhatsApp

### 2. Mise a jour du sommaire

Ajout de l'entree "WhatsApp Business API" dans le tableau de navigation, avec une icone appropriee (MessageCircle ou Phone).

### 3. Mise a jour de la date

Changement de la date de derniere mise a jour de "27 decembre 2024" a "21 fevrier 2026".

### 4. Mise a jour de la section Partage

Ajout de Meta/WhatsApp dans la liste des tiers avec lesquels les donnees sont partagees.

## Details techniques

| Fichier | Modification |
|---------|-------------|
| `src/pages/PrivacyPolicy.tsx` | Ajout section WhatsApp, mise a jour sommaire, date, et section partage |

- Import de `MessageSquare` depuis lucide-react pour l'icone de la nouvelle section
- Import de `Link` deja present pour le lien vers `/data-deletion`
- Numerotation des sections ajustee de 1-11 a 1-12

