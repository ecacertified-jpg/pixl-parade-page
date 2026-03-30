

# Plan : Tester l'envoi du template `joiedevivre_birthday_celebration`

## Analyse du template Meta

D'apres les captures :
- **Header** : Video dynamique
- **Body** : 2 variables — `{{1}}` = prenom (ex: "Aminata"), `{{2}}` = message personnalise (ex: "Que cette annee soit exceptionnelle !")
- **Bouton CTA** : "Voir ma celebration" — URL **dynamique** avec suffixe `{{1}}` (base: `https://joiedevivre-africa.com/dashboard/`, exemple: `.../dashboard/birthday`)
- **Footer** : "JOIE DE VIVRE - Celebrons ensemble"

## Etat actuel du code

**`birthday-wishes/index.ts` (ligne 656-664)** — deja correct :
```ts
sendWhatsAppTemplate(
  profile.phone,
  'joiedevivre_birthday_celebration',
  'fr',
  [firstName, shortMsg],      // body: {{1}}=prenom, {{2}}=message
  ['birthday'],                // button: suffixe URL dynamique
  undefined,                   // pas d'image header
  celebrationVideoUrl          // header video
);
```
Les parametres correspondent au template Meta. Pas de correction necessaire.

## Probleme : `test-whatsapp-send` ne supporte pas les videos ni les boutons

L'utilitaire de test ne gere que `header_image_url`, pas les videos ni les `button_parameters`. Il faut l'enrichir pour tester ce template.

## Modifications

### 1. Enrichir `test-whatsapp-send`

Ajouter le support de :
- `header_video_url` — composant header video
- `button_params` — tableau de suffixes pour boutons CTA dynamiques

### 2. Tester avec des donnees reelles

Recuperer un utilisateur dont c'est l'anniversaire (ou n'importe quel utilisateur avec un telephone valide) et envoyer le template avec :
- `body_params`: `["Prenom", "Que cette annee soit exceptionnelle !"]`
- `button_params`: `["birthday"]`
- `header_video_url`: URL de la video par defaut dans le storage

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/test-whatsapp-send/index.ts` | Ajouter support `header_video_url` et `button_params` |

