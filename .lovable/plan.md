

# Plan : Intégrer le lien Wave Business pour les paiements réels

## Approche en 2 phases

### Phase 1 — Immédiate : Lien marchand Wave (sans API)

Remplacer la simulation Wave par une redirection vers le lien `pay.wave.com` de JDV. Le paiement est réel mais la confirmation reste manuelle (l'admin ou le prestataire confirme la réception).

#### 1. Modifier `WavePaymentSimulation.tsx` → `WavePaymentRedirect.tsx`

Transformer le composant de simulation en composant de redirection :
- Afficher le montant et un bouton "Payer via Wave"
- Au clic, ouvrir `https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/?amount={montant}` dans un nouvel onglet (commandes individuelles)
- Ou ouvrir sans `?amount` (cagnottes, l'utilisateur saisit le montant)
- Après ouverture du lien, afficher un bouton "J'ai effectué le paiement" qui crée la commande avec statut `pending_payment_confirmation`
- Supprimer le badge "Mode simulation"

#### 2. Modifier `Checkout.tsx` — Commandes individuelles

- Remplacer `WavePaymentSimulation` par `WavePaymentRedirect`
- Passer le montant total majoré comme `amount`
- Au retour ("J'ai payé"), créer la commande et appeler `process-wave-payment` pour enregistrer le split

#### 3. Modifier `ContributionModal.tsx` — Cagnottes

- Ajouter un bouton "Contribuer via Wave" qui ouvre le lien sans montant pré-rempli (l'utilisateur choisit)
- Après confirmation manuelle, enregistrer la contribution dans la cagnotte

#### 4. Modifier `process-wave-payment` Edge Function

- Changer `vendor_transfer_status` de `'simulated'` à `'pending'` pour indiquer que le transfert au prestataire est en attente
- Ajouter une note que le payout sera fait manuellement ou via API Payout

#### 5. Nouveau statut de commande

Ajouter un statut `pending_payment_confirmation` dans le flux pour distinguer les commandes Wave en attente de vérification du paiement vs les commandes confirmées.

### Phase 2 — Future : API Wave Checkout + Payout (quand les clés API seront obtenues)

Non implémenté maintenant, mais l'architecture est prête :
- Remplacer le lien par `POST /v1/checkout/sessions` avec `success_url` et `error_url`
- Webhook Wave pour confirmation automatique
- `POST /v1/payout` pour reverser automatiquement au prestataire

## Fichiers modifiés

- `src/components/WavePaymentSimulation.tsx` → renommé en `WavePaymentRedirect.tsx`
- `src/pages/Checkout.tsx` — utiliser le nouveau composant
- `src/components/ContributionModal.tsx` — ajouter option Wave pour cagnottes
- `supabase/functions/process-wave-payment/index.ts` — statut `pending` au lieu de `simulated`

## Détails techniques

### URL construite pour commandes
```
https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/?amount={totalMajoré}
```

### URL pour cagnottes (montant libre)
```
https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/
```

### Flux utilisateur (commande)
```text
Client clique "Payer via Wave"
  → Nouvel onglet : pay.wave.com avec montant pré-rempli
  → Client paie dans Wave
  → Revient sur l'app, clique "J'ai effectué le paiement"
  → Commande créée avec statut pending_payment_confirmation
  → Admin/prestataire vérifie et confirme
  → Split enregistré : commission JDV + montant prestataire
```

