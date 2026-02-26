

## Creer 2 templates WhatsApp dans Meta Business Manager

Vous avez besoin de deux nouveaux modeles WhatsApp HSM pour notifier les clients lorsqu'un cadeau est offert ou qu'une cotisation groupee est lancee. Voici le guide complet pour les configurer dans Meta Business Manager, puis les integrer dans le code.

---

### Template 1 : `joiedevivre_gift_order` (Offrir un cadeau)

**Configuration dans Meta Business Manager :**

| Champ | Valeur |
|-------|--------|
| Nom du modele | `joiedevivre_gift_order` |
| Categorie | **Utilitaire** |
| Sous-type | Par defaut |
| Langue | Francais (`fr`) |

**Corps du message :**
```
Bonne nouvelle ! 🎁 {{1}} vous a offert un cadeau sur Joie de Vivre !

Cadeau : {{2}}
Valeur : {{3}} XOF

Rendez-vous sur l'appli pour decouvrir votre surprise !
```

**Variables :**
- `{{1}}` : Prenom de l'expediteur (ex: "Aminata")
- `{{2}}` : Nom du produit (ex: "Tresse")
- `{{3}}` : Montant formate (ex: "5 000")

**Bouton (optionnel)** : Ajouter un bouton "Voir mon cadeau" de type URL pointant vers `https://joiedevivre-africa.com/orders`

---

### Template 2 : `joiedevivre_group_contribution` (Cotisation groupee)

**Configuration dans Meta Business Manager :**

| Champ | Valeur |
|-------|--------|
| Nom du modele | `joiedevivre_group_contribution` |
| Categorie | **Utilitaire** |
| Sous-type | Par defaut |
| Langue | Francais (`fr`) |

**Corps du message :**
```
Salut {{1}} ! 🤝 Une cotisation groupee a ete lancee pour {{2}} sur Joie de Vivre !

Objectif : {{3}} XOF
Cadeau prevu : {{4}}

Contribuez maintenant pour offrir ensemble un beau cadeau !
```

**Variables :**
- `{{1}}` : Prenom du destinataire du message (ex: "Koffi")
- `{{2}}` : Nom du beneficiaire (ex: "Fatou Bamba")
- `{{3}}` : Montant objectif formate (ex: "25 000")
- `{{4}}` : Nom du produit/cadeau (ex: "Tresse")

**Bouton (optionnel)** : Ajouter un bouton "Contribuer" de type URL pointant vers `https://joiedevivre-africa.com/shop`

---

### Etapes dans Meta Business Manager

Pour chacun des deux modeles :

1. Aller dans **Gestionnaire WhatsApp > Modeles de messages > Gerer les modeles**
2. Cliquer **Creer un modele**
3. Selectionner la categorie **Utilitaire** et le sous-type **Par defaut**
4. Entrer le nom du modele (exactement comme indique ci-dessus, tout en minuscules avec underscores)
5. Selectionner la langue **Francais**
6. Coller le corps du message avec les variables `{{1}}`, `{{2}}`, etc.
7. Ajouter les exemples de contenu pour chaque variable (Meta les exige pour la validation)
8. Optionnellement ajouter un bouton CTA de type URL
9. **Soumettre a examen** - l'approbation prend generalement quelques heures

---

### Integration dans le code

Une fois les modeles approuves par Meta, il faudra modifier deux Edge Functions :

#### Fichier 1 : `supabase/functions/notify-business-order/index.ts`
- Apres la creation de commande, detecter si c'est un cadeau (`beneficiary_phone` present dans la commande)
- Si oui, envoyer le template `joiedevivre_gift_order` au beneficiaire avec les 3 parametres

#### Fichier 2 : Creer ou modifier la logique dans le flux de cotisation groupee
- Quand une cotisation groupee est creee (dans `CollectiveCheckout.tsx` ou l'Edge Function associee), envoyer le template `joiedevivre_group_contribution` aux participants invites

#### Exemple d'appel (pattern existant) :
```typescript
// Cadeau individuel - notifier le beneficiaire
await sendWhatsAppTemplate(
  beneficiaryPhone,
  'joiedevivre_gift_order',
  'fr',
  [senderName, productName, formattedAmount]
);

// Cotisation groupee - notifier les invites
await sendWhatsAppTemplate(
  inviteePhone,
  'joiedevivre_group_contribution',
  'fr',
  [inviteeName, beneficiaryName, targetAmount, productName]
);
```

Ce pattern est identique a celui deja utilise pour `joiedevivre_new_order`, `joiedevivre_birthday_reminder`, etc.

---

### Resume des actions

| Etape | Ou | Quoi |
|-------|----|------|
| 1 | Meta Business Manager | Creer le template `joiedevivre_gift_order` (Utilitaire, 3 variables) |
| 2 | Meta Business Manager | Creer le template `joiedevivre_group_contribution` (Utilitaire, 4 variables) |
| 3 | Meta Business Manager | Soumettre les deux modeles a examen |
| 4 | Code (apres approbation) | Integrer les appels `sendWhatsAppTemplate` dans les Edge Functions concernees |

