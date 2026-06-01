import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPlaylist,
  type CoverVideoItem,
} from "@/utils/coverVideoSchedule";

interface Params {
  birthdayPageId: string | null | undefined;
  birthday: string | null | undefined;
  ownerId?: string | null;
}

/**
 * Returns the ordered playlist of cover videos for a visitor.
 * Re-evaluates when local time crosses an hour boundary.
 */
export function useCoverVideoPlaylist({ birthdayPageId, birthday, ownerId }: Params) {
  const [tick, setTick] = useState(0);

  // Refresh playlist every 15min in case visitor stays long enough to cross a greeting window
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const { data: library = [] } = useQuery({
    queryKey: ["cover-video-library"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cover_video_library")
        .select("id, title, video_url, poster_url, schedule_kind, calendar_month, calendar_day, priority, event_key, event_label")
        .eq("is_active", true)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any): CoverVideoItem => ({
        id: r.id,
        title: r.title,
        video_url: r.video_url,
        poster_url: r.poster_url,
        schedule_kind: r.schedule_kind as CoverVideoItem["schedule_kind"],
        calendar_month: r.calendar_month,
        calendar_day: r.calendar_day,
        priority: r.priority,
        event_key: r.event_key ?? null,
        event_label: r.event_label ?? null,
        source: "library",
      }));
    },
  });

  const { data: userVideos = [] } = useQuery({
    queryKey: ["birthday-page-cover-videos", birthdayPageId],
    enabled: !!birthdayPageId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("birthday_page_cover_videos")
        .select("id, video_url, poster_url, schedule_kind, display_order, calendar_month, calendar_day, event_key, event_label")
        .eq("birthday_page_id", birthdayPageId!)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any): CoverVideoItem => ({
        id: r.id,
        video_url: r.video_url,
        poster_url: r.poster_url,
        schedule_kind: r.schedule_kind as CoverVideoItem["schedule_kind"],
        display_order: r.display_order,
        calendar_month: r.calendar_month ?? null,
        calendar_day: r.calendar_day ?? null,
        event_key: r.event_key ?? null,
        event_label: r.event_label ?? null,
        source: "user",
      }));
    },
  });

  const { data: viewCounts = {} } = useQuery({
    queryKey: ["cover-video-views", ownerId],
    enabled: !!ownerId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("birthday_page_cover_video_views")
        .select("video_id, view_count")
        .eq("owner_id", ownerId!);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) map[r.video_id] = r.view_count ?? 0;
      return map;
    },
  });

  const playlist = useMemo(
    () => buildPlaylist(userVideos, library, birthday ?? null, new Date(), ownerId ? viewCounts : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userVideos, library, birthday, tick, ownerId, viewCounts],
  );

  return { playlist };
}