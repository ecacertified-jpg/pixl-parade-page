-- Politique permettant aux clients de confirmer la réception de leur commande
-- Les clients peuvent mettre à jour uniquement leurs propres commandes
CREATE POLICY "Customers can confirm their orders"
ON public.business_orders
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);