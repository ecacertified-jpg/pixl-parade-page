-- Permettre aux utilisateurs qui peuvent voir la cagnotte de voir les données business_collective_funds associées
-- Cela permet de récupérer le product_id et donc l'image du produit

CREATE POLICY "Users who can see fund can see business fund data"
ON public.business_collective_funds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM collective_funds cf
    WHERE cf.id = business_collective_funds.fund_id
  )
);