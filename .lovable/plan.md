

## Plan : Ajouter Wave comme option de paiement au Checkout (mode simulation)

### Contexte
Le checkout actuel propose 2 options : "Paiement a la livraison" et "Mobile Money (Orange/MTN)". Wave sera ajoute comme 3e option. En mode simulation, le flux Wave sera simule cote client (redirection fictive, confirmation automatique) pour tester l'UX avant de connecter la vraie API Wave.

### Architecture

```text
Checkout.tsx
  └─ RadioGroup (payment method)
       ├─ delivery       (existant)
       ├─ mobile         (existant)  
       └─ wave           (NOUVEAU)

handleConfirmOrder()
  └─ si wave → ouvrir modale simulation Wave
       └─ confirmation → creer commande normalement
```

### Modifications

#### 1. Table `payment_methods` — ajouter Wave
Insertion d'une entree Wave dans la table existante :
```sql
INSERT INTO payment_methods (code, name, display_name, currency, is_active, config)
VALUES ('wave', 'Wave', 'Wave', 'XOF', true, '{"supported_countries": ["CI", "SN"]}');
```

#### 2. `src/pages/Checkout.tsx`
- Ajouter une 3e option `wave` dans le `RadioGroup` avec le logo Wave (icone bleue)
- Quand `paymentMethod === 'wave'` et clic sur "Confirmer" :
  - Ouvrir une modale de simulation Wave (numero de telephone, montant, animation de chargement 2s, puis confirmation)
  - Apres confirmation simulee → executer `handleConfirmOrder` normalement avec `payment_method: 'wave'`
- Le `notes` de la commande sera "Paiement Wave" et le `payment_method` des business_orders sera `'wave'`

#### 3. `src/components/WavePaymentSimulation.tsx` (nouveau)
Composant Dialog/Drawer simulant le flux Wave :
- Affiche le montant a payer (prix majore)
- Champ pour saisir le numero Wave
- Bouton "Payer" → spinner 2s → message de confirmation
- Callback `onSuccess` pour continuer le checkout
- Badge "Mode simulation" visible

### Ce qui ne change PAS
- Le systeme de majoration des prix (deja en place via `applyMarkup`)
- Le back office prestataire (prix d'origine inchange)
- Les autres moyens de paiement existants

### Fichiers concernes
- `src/pages/Checkout.tsx` (modification)
- `src/components/WavePaymentSimulation.tsx` (creation)
- Migration SQL (insertion dans `payment_methods`)

