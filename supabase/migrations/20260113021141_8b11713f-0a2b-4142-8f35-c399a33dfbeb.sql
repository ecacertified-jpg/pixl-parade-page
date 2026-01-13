-- 1. Politique DELETE pour profiles (les admins peuvent supprimer les profils)
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- 2. Politique DELETE pour notifications (les admins peuvent supprimer les notifications)
CREATE POLICY "Admins can delete notifications"
ON notifications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- 3. Politique DELETE pour favorites (ajouter admins)
CREATE POLICY "Admins can delete user favorites"
ON favorites FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- 4. Politique DELETE pour posts (ajouter admins)
CREATE POLICY "Admins can delete user posts"
ON posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- 5. Politique DELETE pour contacts (ajouter admins)
CREATE POLICY "Admins can delete user contacts"
ON contacts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- 6. Politique UPDATE pour collective_funds (admins peuvent orpheliner)
CREATE POLICY "Admins can update collective funds"
ON collective_funds FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);