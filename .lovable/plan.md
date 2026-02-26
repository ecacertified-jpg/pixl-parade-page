

## Test end-to-end de notify-business-fund-contributors

### Situation actuelle

La table `business_collective_funds` est **vide** -- l'enregistrement de test n'a pas encore ete insere. La FK manquante a ete corrigee (migration appliquee), et la fonction Edge est deployee.

### Donnees identifiees pour le test

| Element | Valeur |
|---------|--------|
| **Boutique** | NewTech (`6f6556d8-1787-450a-a0cb-bec36ed6df1e`) |
| **Fund actif** | "Samsung A16 128Go ROM Noir pour Meera" (`3249d41e-5347-4e0b-87dd-e4b34dfb27e9`) - target: 120 000 F |
| **Produit** | Samsung A16 128Go ROM Noir (`a9a7be60-04a3-4ce6-90b5-b2595db2e46d`) - 120 000 F |
| **Beneficiaire** | Aboutou WhatsApp (`b8d0d4e4-3eec-45df-a87d-b9ec7e4bf95a`) |

### Etape 1 : Inserer l'enregistrement de test (migration SQL)

Creer une migration SQL pour inserer un enregistrement dans `business_collective_funds` :

```sql
INSERT INTO business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id, auto_notifications)
VALUES (
  '3249d41e-5347-4e0b-87dd-e4b34dfb27e9',  -- Fund Samsung A16 pour Meera
  '6f6556d8-1787-450a-a0cb-bec36ed6df1e',  -- NewTech
  'a9a7be60-04a3-4ce6-90b5-b2595db2e46d',  -- Samsung A16 128Go ROM Noir
  'b8d0d4e4-3eec-45df-a87d-b9ec7e4bf95a',  -- Aboutou WhatsApp (Meera)
  true
);
```

### Etape 2 : Appeler la fonction Edge

Invoquer manuellement `notify-business-fund-contributors` avec :

```json
{
  "fund_id": "3249d41e-5347-4e0b-87dd-e4b34dfb27e9",
  "notification_type": "created"
}
```

### Etape 3 : Verifier les resultats

1. **Logs Edge Function** : verifier que l'erreur `PGRST116`/`PGRST200` a disparu
2. **Table `scheduled_notifications`** : verifier que des notifications ont ete creees pour les amis du beneficiaire
3. **WhatsApp** : verifier dans les logs si des messages `joiedevivre_group_contribution` ont ete envoyes
4. **Table `contact_relationships`** : si aucun ami n'est trouve (`can_see_funds = true`), la fonction retournera "No friends to notify" -- ce qui est un comportement normal a documenter

### Details techniques

- Aucune modification du code Edge Function necessaire
- La fonction utilise `contact_relationships` pour trouver les amis du beneficiaire avec `can_see_funds = true`
- Si le beneficiaire n'a pas d'amis dans cette table, le flux s'arrete normalement sans erreur
- Le template WhatsApp `joiedevivre_group_contribution` ne sera envoye que si des amis ont un numero de telephone dans leur profil

