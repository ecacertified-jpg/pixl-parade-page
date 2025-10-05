-- 1. Corriger le contact Florentin dans la liste d'Eca
UPDATE contacts 
SET user_id = '3fc4a030-46ca-44f7-92d8-eb2d70e1610e'
WHERE id = '1cd92188-bd90-4ba0-9363-91493c74f8d8'
AND name = 'Florentin';

-- 2. Créer la relation d'amitié entre Sali et Florentin
INSERT INTO contact_relationships (user_a, user_b, can_see_funds, relationship_type)
VALUES (
  'b8d0d4e4-3eec-45df-a87d-b9ec7e4bf95a',  -- Sali
  '3fc4a030-46ca-44f7-92d8-eb2d70e1610e',  -- Florentin
  true,
  'friend'
)
ON CONFLICT DO NOTHING;

-- 3. Créer une fonction pour vérifier si un utilisateur peut voir la cagnotte d'un ami
CREATE OR REPLACE FUNCTION can_see_fund_for_friend(fund_uuid uuid, viewer_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beneficiary_user_id uuid;
BEGIN
  -- Récupérer le user_id du bénéficiaire via le contact
  SELECT c.user_id INTO beneficiary_user_id
  FROM collective_funds cf
  JOIN contacts c ON c.id = cf.beneficiary_contact_id
  WHERE cf.id = fund_uuid;
  
  -- Si pas de bénéficiaire, retourner false
  IF beneficiary_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si le viewer est ami avec le bénéficiaire
  RETURN EXISTS (
    SELECT 1 FROM contact_relationships cr
    WHERE (cr.user_a = viewer_uuid AND cr.user_b = beneficiary_user_id)
       OR (cr.user_b = viewer_uuid AND cr.user_a = beneficiary_user_id)
  );
END;
$$;

-- 4. Supprimer les anciennes politiques conflictuelles
DROP POLICY IF EXISTS "Users can view accessible funds" ON collective_funds;
DROP POLICY IF EXISTS "Alternative fund access policy" ON collective_funds;

-- 5. Créer une nouvelle politique unifiée qui inclut les amis du bénéficiaire
CREATE POLICY "Users can view funds with friend access" 
ON collective_funds
FOR SELECT 
USING (
  auth.uid() = creator_id  -- Le créateur voit toujours ses cagnottes
  OR is_public = true  -- Les cagnottes publiques sont visibles par tous
  OR EXISTS (  -- Contributeurs
    SELECT 1 FROM fund_contributions fc
    WHERE fc.fund_id = collective_funds.id 
    AND fc.contributor_id = auth.uid()
  )
  OR EXISTS (  -- Amis du créateur avec permission
    SELECT 1 FROM contact_relationships cr
    WHERE ((cr.user_a = auth.uid() AND cr.user_b = creator_id)
       OR (cr.user_b = auth.uid() AND cr.user_a = creator_id))
    AND cr.can_see_funds = true
  )
  OR can_see_fund_for_friend(id, auth.uid())  -- NOUVEAU : Amis du bénéficiaire peuvent voir la cagnotte
);