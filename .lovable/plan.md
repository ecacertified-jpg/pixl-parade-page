
# Template WhatsApp pour les nouvelles commandes prestataires

## Template a creer dans Meta Business Manager

### Nom du template
`joiedevivre_new_order`

### Categorie
**Utility** (notification transactionnelle liee a une commande)

### Langue
Francais (`fr`)

### Corps du message (Body)
```
Nouvelle commande sur Joie de Vivre !

Client : {{1}}
Montant : {{2}} XOF
Commande : {{3}}

Connectez-vous pour accepter ou refuser cette commande.
```

**Parametres :**
| Variable | Valeur | Exemple |
|----------|--------|---------|
| `{{1}}` | Prenom du client | "Aminata" |
| `{{2}}` | Montant total formate | "25 000" |
| `{{3}}` | Resume court de la commande (1er article ou nombre d'articles) | "Gateau chocolat x1" |

### Footer (statique)
```
Repondez rapidement pour satisfaire vos clients
```

### Boutons (optionnel mais recommande)
| Type | Texte | Action |
|------|-------|--------|
| URL | Voir la commande | `https://joiedevivre-africa.com/business-account?tab=orders` |

> Si vous ajoutez un suffixe dynamique au bouton URL (ex: `&highlight={{1}}`), il faudra passer un composant `button` supplementaire dans l'appel API avec l'ID de commande.

---

## Exemples de contenu pour la soumission Meta

Meta exige des exemples concrets lors de la soumission du template :

| Variable | Exemple |
|----------|---------|
| `{{1}}` | Aminata |
| `{{2}}` | 25 000 |
| `{{3}}` | Gateau anniversaire x1 |

---

## Integration technique (apres approbation Meta)

### Fichier a modifier : `supabase/functions/notify-new-order/index.ts` (ou equivalent)

Appel a `sendWhatsAppTemplate` avec 3 parametres body :

```typescript
await sendWhatsAppTemplate(
  businessPhone,          // telephone du prestataire
  'joiedevivre_new_order',
  'fr',
  [
    customerName,                              // {{1}} - Prenom client
    totalAmount.toLocaleString('fr-FR'),        // {{2}} - Montant
    orderSummaryShort                           // {{3}} - Resume commande
  ]
);
```

### Routage intelligent

Le meme routage par prefixe telephonique (`getSmsPrefixReliability`) sera applique pour determiner si un SMS complementaire est envoye au prestataire ou uniquement le WhatsApp.

---

## Etapes pour activer le template

1. **Meta Business Manager** : Creer le template `joiedevivre_new_order` avec le contenu ci-dessus
2. **Attendre l'approbation** de Meta (generalement quelques heures)
3. **Implementer** l'appel dans la Edge Function qui gere la creation de commande
4. **Deployer** la Edge Function mise a jour
5. **Tester** avec un numero reel pour verifier la delivrabilite

---

## Notes importantes

- Le template `Utility` a un cout plus bas que `Marketing` et un taux d'approbation plus eleve
- Garder le resume de commande (`{{3}}`) court (max ~50 caracteres) pour eviter les troncatures
- Un fallback en texte libre est maintenu pour les cas ou le template echoue (conversation active dans la fenetre de 24h)
