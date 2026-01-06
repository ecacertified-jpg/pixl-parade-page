-- Table pour les conversations WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche par numéro de téléphone
CREATE UNIQUE INDEX whatsapp_conversations_phone_idx ON public.whatsapp_conversations(phone_number);
CREATE INDEX whatsapp_conversations_user_idx ON public.whatsapp_conversations(user_id);
CREATE INDEX whatsapp_conversations_status_idx ON public.whatsapp_conversations(status);

-- Table pour les messages WhatsApp
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'template')),
  whatsapp_message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les messages
CREATE INDEX whatsapp_messages_conversation_idx ON public.whatsapp_messages(conversation_id);
CREATE INDEX whatsapp_messages_whatsapp_id_idx ON public.whatsapp_messages(whatsapp_message_id);
CREATE INDEX whatsapp_messages_created_idx ON public.whatsapp_messages(created_at DESC);

-- Trigger pour mettre à jour updated_at sur conversations
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour last_message_at quand un message est ajouté
CREATE OR REPLACE FUNCTION public.update_whatsapp_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.whatsapp_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_whatsapp_last_message
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_conversation_last_message();

-- RLS Policies
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all whatsapp conversations"
  ON public.whatsapp_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all whatsapp conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can view all whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all whatsapp messages"
  ON public.whatsapp_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Les utilisateurs liés peuvent voir leurs conversations
CREATE POLICY "Users can view own whatsapp conversations"
  ON public.whatsapp_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations
      WHERE id = whatsapp_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Service role peut tout faire (pour l'edge function)
CREATE POLICY "Service role full access conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access messages"
  ON public.whatsapp_messages FOR ALL
  USING (auth.role() = 'service_role');