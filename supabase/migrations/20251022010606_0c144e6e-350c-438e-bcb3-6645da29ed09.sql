-- Drop existing function first
DROP FUNCTION IF EXISTS public.increment_gratitude_reaction(uuid);

-- Create community_scores table for gamification
CREATE TABLE IF NOT EXISTS public.community_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  gifts_given_count INTEGER NOT NULL DEFAULT 0,
  funds_created_count INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  reactions_received INTEGER NOT NULL DEFAULT 0,
  badge_level TEXT NOT NULL DEFAULT 'bronze',
  rank_position INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.community_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Community scores are viewable by everyone"
  ON public.community_scores
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own community score"
  ON public.community_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert community scores"
  ON public.community_scores
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_community_scores_user_id ON public.community_scores(user_id);
CREATE INDEX idx_community_scores_total_points ON public.community_scores(total_points DESC);
CREATE INDEX idx_community_scores_badge_level ON public.community_scores(badge_level);

-- Function to update community scores
CREATE OR REPLACE FUNCTION public.update_community_score(
  p_user_id UUID,
  p_points_delta INTEGER DEFAULT 0,
  p_gifts_delta INTEGER DEFAULT 0,
  p_funds_delta INTEGER DEFAULT 0,
  p_posts_delta INTEGER DEFAULT 0,
  p_reactions_delta INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_points INTEGER;
  v_new_badge TEXT;
BEGIN
  INSERT INTO public.community_scores (
    user_id, total_points, gifts_given_count, funds_created_count, posts_count, reactions_received, last_updated
  )
  VALUES (p_user_id, p_points_delta, p_gifts_delta, p_funds_delta, p_posts_delta, p_reactions_delta, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = community_scores.total_points + p_points_delta,
    gifts_given_count = community_scores.gifts_given_count + p_gifts_delta,
    funds_created_count = community_scores.funds_created_count + p_funds_delta,
    posts_count = community_scores.posts_count + p_posts_delta,
    reactions_received = community_scores.reactions_received + p_reactions_delta,
    last_updated = now()
  RETURNING total_points INTO v_new_points;

  IF v_new_points >= 1000 THEN v_new_badge := 'platinum';
  ELSIF v_new_points >= 500 THEN v_new_badge := 'gold';
  ELSIF v_new_points >= 200 THEN v_new_badge := 'silver';
  ELSE v_new_badge := 'bronze';
  END IF;

  UPDATE public.community_scores
  SET badge_level = v_new_badge
  WHERE user_id = p_user_id;
END;
$$;

-- Function to update rankings
CREATE OR REPLACE FUNCTION public.update_community_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH ranked_scores AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, last_updated ASC) as new_rank
    FROM public.community_scores
  )
  UPDATE public.community_scores cs
  SET rank_position = rs.new_rank
  FROM ranked_scores rs
  WHERE cs.user_id = rs.user_id;
END;
$$;

-- Trigger to update rankings
CREATE OR REPLACE FUNCTION public.trigger_update_rankings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_community_rankings();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_rankings_after_score_change ON public.community_scores;
CREATE TRIGGER update_rankings_after_score_change
AFTER INSERT OR UPDATE ON public.community_scores
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_update_rankings();

-- Function to increment gratitude reactions
CREATE OR REPLACE FUNCTION public.increment_gratitude_reaction(p_message_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.gratitude_wall
  SET reaction_count = reaction_count + 1
  WHERE id = p_message_id;
END;
$$;