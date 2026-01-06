-- Corriger le search_path de la fonction WhatsApp
CREATE OR REPLACE FUNCTION public.update_whatsapp_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.whatsapp_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;