-- Enable Row Level Security on ai_knowledge_base
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: Only active admins can manage AI knowledge (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage AI knowledge"
ON public.ai_knowledge_base
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy: All authenticated users can read active AI knowledge entries
CREATE POLICY "Users can read active AI knowledge"
ON public.ai_knowledge_base
FOR SELECT
USING (is_active = true);