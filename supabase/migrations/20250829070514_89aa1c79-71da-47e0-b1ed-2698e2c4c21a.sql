-- Ajouter une colonne pour stocker le nom du destinataire quand ce n'est pas un utilisateur enregistré
ALTER TABLE public.gifts 
ADD COLUMN receiver_name TEXT;

-- Mettre à jour la contrainte pour permettre receiver_id nullable quand receiver_name est fourni
ALTER TABLE public.gifts 
ALTER COLUMN receiver_id DROP NOT NULL;