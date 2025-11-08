-- Create fund_comments table
CREATE TABLE public.fund_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fund_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view comments for funds they can see"
ON public.fund_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = fund_comments.fund_id
    AND user_can_see_fund(cf.id, auth.uid())
  )
);

CREATE POLICY "Authenticated users can create comments on accessible funds"
ON public.fund_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = fund_comments.fund_id
    AND user_can_see_fund(cf.id, auth.uid())
  )
);

CREATE POLICY "Users can update their own comments"
ON public.fund_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.fund_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_fund_comments_fund_id ON public.fund_comments(fund_id);
CREATE INDEX idx_fund_comments_created_at ON public.fund_comments(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fund_comments_updated_at
BEFORE UPDATE ON public.fund_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_comments;