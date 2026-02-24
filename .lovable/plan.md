

# Correction du mapping des parametres du template WhatsApp

## Probleme identifie

Le template `joiedevivre_contact_added` dans Meta Business Manager contient :

- **Body** : "Bonjour ! {{1}} t'a ajoute a son cercle d'amis sur Joie de Vivre ! Ton anniversaire est dans {{2}} jours." -- **2 parametres**
- **Footer** (statique) : "Quels sont tes souhaits de cadeaux pour ton anniversaire ?"
- **Bouton URL** : "Cree ta liste de cadeaux" -- potentiellement un suffixe dynamique

Le code actuel envoie **3 parametres body** : `[userName, daysUntil, whatsappCallToAction]`, ce qui provoque l'erreur Meta `#132000 - Number of parameters does not match`.

## Correction

### Fichier : `supabase/functions/notify-contact-added/index.ts` (ligne ~217)

Reduire les parametres body a 2 (userName et daysUntil). Si le bouton URL a un suffixe dynamique, ajouter un composant `button` separe.

**Avant :**
```typescript
sendWhatsAppTemplate(
  contact_phone,
  'joiedevivre_contact_added',
  'fr',
  [userName, daysUntil.toString(), whatsappCallToAction]
)
```

**Apres :**
```typescript
sendWhatsAppTemplate(
  contact_phone,
  'joiedevivre_contact_added',
  'fr',
  [userName, daysUntil.toString()]
)
```

### Fichier : `supabase/functions/_shared/sms-sender.ts`

Aucune modification necessaire -- la fonction `sendWhatsAppTemplate` accepte deja un tableau de parametres de taille variable.

### Fichier : `supabase/functions/notify-contact-added/index.ts`

Nettoyage : la variable `whatsappCallToAction` ne sera plus utilisee pour le template (elle reste utile pour le message fallback en texte libre, donc elle est conservee).

## Resultat attendu

Le template WhatsApp sera envoye avec exactement 2 parametres body, correspondant aux 2 variables `{{1}}` et `{{2}}` du template Meta. L'erreur `#132000` sera resolue et le message sera delivre via le template HSM au lieu du fallback texte libre.

