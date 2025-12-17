-- Table pour stocker l'historique des feedbacks sur les suggestions IA
CREATE TABLE public.suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_id UUID REFERENCES public.gift_recommendations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  occasion TEXT,
  
  -- Feedback principal
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('accepted', 'rejected', 'purchased', 'saved')),
  feedback_reason TEXT,
  
  -- Contexte de la décision
  match_score INTEGER,
  price_at_feedback NUMERIC,
  
  -- Métadonnées
  source TEXT DEFAULT 'recommendation',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte d'unicité
  UNIQUE(user_id, product_id, recommendation_id)
);

-- Index pour améliorer les performances des requêtes IA
CREATE INDEX idx_suggestion_feedback_user_product ON public.suggestion_feedback(user_id, product_id);
CREATE INDEX idx_suggestion_feedback_user_occasion ON public.suggestion_feedback(user_id, occasion);
CREATE INDEX idx_suggestion_feedback_type ON public.suggestion_feedback(feedback_type);
CREATE INDEX idx_suggestion_feedback_created ON public.suggestion_feedback(created_at DESC);

-- RLS policies
ALTER TABLE public.suggestion_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.suggestion_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback" ON public.suggestion_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.suggestion_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON public.suggestion_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour obtenir les statistiques de feedback d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_feedback_stats(p_user_id UUID)
RETURNS TABLE (
  accepted_count BIGINT,
  rejected_count BIGINT,
  purchased_count BIGINT,
  saved_count BIGINT,
  top_rejection_reasons JSONB,
  preferred_categories JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE sf.feedback_type = 'accepted') as accepted_count,
    COUNT(*) FILTER (WHERE sf.feedback_type = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE sf.feedback_type = 'purchased') as purchased_count,
    COUNT(*) FILTER (WHERE sf.feedback_type = 'saved') as saved_count,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('reason', reason, 'count', cnt)), '[]'::jsonb)
      FROM (
        SELECT feedback_reason as reason, COUNT(*) as cnt
        FROM public.suggestion_feedback
        WHERE user_id = p_user_id AND feedback_type = 'rejected' AND feedback_reason IS NOT NULL
        GROUP BY feedback_reason
        ORDER BY cnt DESC
        LIMIT 5
      ) reasons
    ) as top_rejection_reasons,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('category', cat_name, 'count', cnt)), '[]'::jsonb)
      FROM (
        SELECT c.name as cat_name, COUNT(*) as cnt
        FROM public.suggestion_feedback sf2
        JOIN public.products p ON p.id = sf2.product_id
        JOIN public.categories c ON c.id = p.category_id
        WHERE sf2.user_id = p_user_id AND sf2.feedback_type IN ('accepted', 'purchased')
        GROUP BY c.name
        ORDER BY cnt DESC
        LIMIT 5
      ) cats
    ) as preferred_categories
  FROM public.suggestion_feedback sf
  WHERE sf.user_id = p_user_id;
END;
$$;