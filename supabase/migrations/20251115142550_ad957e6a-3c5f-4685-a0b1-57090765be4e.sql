-- Phase 1: Tables et fonctions pour le système de codes de parrainage

-- Table referral_codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Code de parrainage unique
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL DEFAULT 'personal',
  
  -- Configuration
  label TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  signups_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Validité
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Contraintes
  CONSTRAINT code_format_check CHECK (
    code ~ '^[A-Z0-9]{6,12}$' OR code ~ '^JOIE-[A-Z0-9]{6}$'
  )
);

-- Indexes pour referral_codes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes(is_active) WHERE is_active = true;

-- RLS Policies pour referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own codes" ON public.referral_codes;
CREATE POLICY "Users can view their own codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own codes" ON public.referral_codes;
CREATE POLICY "Users can create their own codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own codes" ON public.referral_codes;
CREATE POLICY "Users can update their own codes"
  ON public.referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own codes" ON public.referral_codes;
CREATE POLICY "Users can delete their own codes"
  ON public.referral_codes FOR DELETE
  USING (auth.uid() = user_id);

-- Table referral_tracking
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_user_id UUID REFERENCES auth.users(id),
  
  -- Événement
  event_type TEXT NOT NULL,
  conversion_value NUMERIC,
  
  -- Contexte technique
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  
  -- Contexte géographique
  country TEXT,
  city TEXT,
  
  -- UTM et tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Metadata additionnelle
  metadata JSONB DEFAULT '{}'
);

-- Indexes pour referral_tracking
CREATE INDEX IF NOT EXISTS idx_referral_tracking_code_id ON public.referral_tracking(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON public.referral_tracking(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_event_type ON public.referral_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_created_at ON public.referral_tracking(created_at DESC);

-- RLS pour referral_tracking
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their referral tracking" ON public.referral_tracking;
CREATE POLICY "Users can view their referral tracking"
  ON public.referral_tracking FOR SELECT
  USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "System can insert tracking events" ON public.referral_tracking;
CREATE POLICY "System can insert tracking events"
  ON public.referral_tracking FOR INSERT
  WITH CHECK (true);

-- Ajouter colonnes à profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_primary_referral_code ON public.profiles(primary_referral_code);

-- Fonction: Génération de code unique
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code(
  user_uuid UUID,
  code_format TEXT DEFAULT 'JOIE'
)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Générer un code selon le format
    IF code_format = 'JOIE' THEN
      new_code := 'JOIE-' || upper(substr(md5(random()::text || user_uuid::text), 1, 6));
    ELSIF code_format = 'SHORT' THEN
      new_code := upper(substr(md5(random()::text || user_uuid::text), 1, 8));
    ELSE
      new_code := upper(substr(md5(random()::text || user_uuid::text), 1, 10));
    END IF;
    
    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction: Statistiques détaillées par code
CREATE OR REPLACE FUNCTION public.get_referral_code_stats(code_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_views', COUNT(*) FILTER (WHERE event_type = 'view'),
    'total_clicks', COUNT(*) FILTER (WHERE event_type = 'click'),
    'total_signups', COUNT(*) FILTER (WHERE event_type = 'signup'),
    'total_conversions', COUNT(*) FILTER (WHERE event_type = 'conversion'),
    'conversion_rate', ROUND(
      (COUNT(*) FILTER (WHERE event_type = 'signup')::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE event_type = 'click'), 0)) * 100, 
      2
    ),
    'top_sources', (
      SELECT json_agg(json_build_object('source', utm_source, 'count', count))
      FROM (
        SELECT utm_source, COUNT(*) as count
        FROM public.referral_tracking
        WHERE referral_code_id = code_id AND utm_source IS NOT NULL
        GROUP BY utm_source
        ORDER BY count DESC
        LIMIT 5
      ) sources
    ),
    'geographic_distribution', (
      SELECT json_agg(json_build_object('country', country, 'count', count))
      FROM (
        SELECT country, COUNT(*) as count
        FROM public.referral_tracking
        WHERE referral_code_id = code_id AND country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      ) geo
    ),
    'timeline', (
      SELECT json_agg(json_build_object('date', date, 'signups', signups))
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE event_type = 'signup') as signups
        FROM public.referral_tracking
        WHERE referral_code_id = code_id
        AND created_at >= now() - interval '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ) timeline
    )
  ) INTO result
  FROM public.referral_tracking
  WHERE referral_code_id = code_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Créer code par défaut à l'inscription
CREATE OR REPLACE FUNCTION public.create_default_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Générer un code unique
  new_code := public.generate_unique_referral_code(NEW.user_id, 'JOIE');
  
  -- Créer le code de parrainage
  INSERT INTO public.referral_codes (
    user_id,
    code,
    code_type,
    label,
    is_primary
  ) VALUES (
    NEW.user_id,
    new_code,
    'personal',
    'Code principal',
    true
  );
  
  -- Mettre à jour le profil
  UPDATE public.profiles
  SET primary_referral_code = new_code
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_referral ON public.profiles;
CREATE TRIGGER on_profile_created_referral
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_referral_code();