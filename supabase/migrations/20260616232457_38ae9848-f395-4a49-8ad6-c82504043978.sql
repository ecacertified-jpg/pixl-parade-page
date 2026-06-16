
CREATE TABLE public.live_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Live',
  context_type text NOT NULL DEFAULT 'standalone' CHECK (context_type IN ('celebration_post','birthday_page','event_page','standalone')),
  context_id uuid,
  livekit_room_name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('scheduled','live','ended')),
  max_participants integer NOT NULL DEFAULT 20,
  is_public boolean NOT NULL DEFAULT true,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.live_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('host','co_host','guest','viewer')),
  is_muted boolean NOT NULL DEFAULT false,
  camera_off boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

GRANT SELECT ON public.live_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_rooms TO authenticated;
GRANT ALL ON public.live_rooms TO service_role;

GRANT SELECT ON public.live_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_participants TO authenticated;
GRANT ALL ON public.live_participants TO service_role;

ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public live rooms are viewable"
ON public.live_rooms FOR SELECT
USING (
  is_public = true
  OR auth.uid() = host_id
  OR EXISTS (SELECT 1 FROM public.live_participants p WHERE p.room_id = live_rooms.id AND p.user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create live rooms"
ON public.live_rooms FOR INSERT TO authenticated
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their live room"
ON public.live_rooms FOR UPDATE TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can delete their live room"
ON public.live_rooms FOR DELETE TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Participants viewable for public or member rooms"
ON public.live_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.live_rooms r
    WHERE r.id = live_participants.room_id
      AND (r.is_public = true OR r.host_id = auth.uid())
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users insert their own participation"
ON public.live_participants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "User updates own participation"
ON public.live_participants FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Host can manage participants"
ON public.live_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.live_rooms r WHERE r.id = live_participants.room_id AND r.host_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.live_rooms r WHERE r.id = live_participants.room_id AND r.host_id = auth.uid()));

CREATE TRIGGER trg_live_rooms_updated_at BEFORE UPDATE ON public.live_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_live_participants_updated_at BEFORE UPDATE ON public.live_participants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_rooms;

CREATE INDEX idx_live_rooms_host ON public.live_rooms(host_id);
CREATE INDEX idx_live_rooms_status ON public.live_rooms(status);
CREATE INDEX idx_live_participants_room ON public.live_participants(room_id);
