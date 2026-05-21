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
}

/**
 * Returns the ordered playlist of cover videos for a visitor.
 * Re-evaluates when local time crosses an hour boundary.
 */
export function useCoverVideoPlaylist({ birthdayPageId, birthday }: Params) {
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
      const { data, error } = await supabase
        .from("cover_video_library")
        .select("id, title, video_url, poster_url, schedule_kind, calendar_month, calendar_day, priority")
        .eq("is_active", true)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []).map<CoverVideoItem>((r) => ({
        id: r.id,
        title: r.title,
        video_url: r.video_url,
        poster_url: r.poster_url,
        schedule_kind: r.schedule_kind as CoverVideoItem["schedule_kind"],
        calendar_month: r.calendar_month,
        calendar_day: r.calendar_day,
        priority: r.priority,
        source: "library",
      }));
    },
  });

  const { data: userVideos = [] } = useQuery({
    queryKey: ["birthday-page-cover-videos", birthdayPageId],
    enabled: !!birthdayPageId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("birthday_page_cover_videos")
        .select("id, video_url, poster_url, schedule_kind, display_order")
        .eq("birthday_page_id", birthdayPageId!)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map<CoverVideoItem>((r) => ({
        id: r.id,
        video_url: r.video_url,
        poster_url: r.poster_url,
        schedule_kind: r.schedule_kind as CoverVideoItem["schedule_kind"],
        display_order: r.display_order,
        source: "user",
      }));
    },
  });

  const playlist = useMemo(
    () => buildPlaylist(userVideos, library, birthday ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userVideos, library, birthday, tick],
  );

  return { playlist };
}