
CREATE OR REPLACE FUNCTION public.is_live_room_host(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.live_rooms WHERE id = _room_id AND host_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_live_room_public(_room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.live_rooms WHERE id = _room_id AND is_public = true)
$$;

CREATE OR REPLACE FUNCTION public.is_live_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.live_participants WHERE room_id = _room_id AND user_id = _user_id)
$$;

DROP POLICY IF EXISTS "Public live rooms are viewable" ON public.live_rooms;
CREATE POLICY "Public live rooms are viewable" ON public.live_rooms
FOR SELECT USING (
  is_public = true
  OR auth.uid() = host_id
  OR public.is_live_room_member(id, auth.uid())
);

DROP POLICY IF EXISTS "Participants viewable for public or member rooms" ON public.live_participants;
CREATE POLICY "Participants viewable for public or member rooms" ON public.live_participants
FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_live_room_host(room_id, auth.uid())
  OR public.is_live_room_public(room_id)
);

DROP POLICY IF EXISTS "Host can manage participants" ON public.live_participants;
CREATE POLICY "Host can manage participants" ON public.live_participants
FOR ALL USING (public.is_live_room_host(room_id, auth.uid()))
WITH CHECK (public.is_live_room_host(room_id, auth.uid()));
