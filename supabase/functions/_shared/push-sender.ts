// Shared OneSignal + in-app push helper for internal trigger/cron functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ONESIGNAL_APP_ID = "52d13eb4-510f-4bb0-8909-d3eb996e91cd";
const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

export interface PushPayload {
  user_ids: string[];
  title: string;
  message: string;
  url?: string;
  category?: "birthday" | "fund" | "gift" | "gratitude" | "order" | "other";
  type?: string;
  data?: Record<string, unknown>;
  // Preference column to gate-check (e.g. "push_new_reaction"). Optional.
  preference_key?: string;
}

export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

export async function sendPushToUsers(payload: PushPayload) {
  const admin = getAdminClient();
  const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

  let userIds = Array.from(new Set(payload.user_ids.filter(Boolean)));
  if (userIds.length === 0) return { sent: 0, in_app: 0 };

  // Filter by user preferences (push_enabled + specific key)
  if (payload.preference_key) {
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select(`user_id, push_enabled, ${payload.preference_key}`)
      .in("user_id", userIds);
    const allowed = new Set(
      (prefs ?? [])
        .filter((p: any) => p.push_enabled !== false && p[payload.preference_key!] !== false)
        .map((p: any) => p.user_id as string),
    );
    // Users with no prefs row default to allowed (defaults = true)
    const withPrefs = new Set((prefs ?? []).map((p: any) => p.user_id as string));
    userIds = userIds.filter((u) => allowed.has(u) || !withPrefs.has(u));
  }

  if (userIds.length === 0) return { sent: 0, in_app: 0 };

  // 1) In-app notifications
  const inAppRows = userIds.map((uid) => ({
    user_id: uid,
    title: payload.title,
    message: payload.message,
    type: payload.type || payload.category || "other",
    action_url: payload.url ?? null,
    metadata: payload.data ?? {},
  }));
  await admin.from("notifications").insert(inAppRows);

  // 2) OneSignal push
  let sent = 0;
  let onesignalId: string | null = null;
  if (restApiKey) {
    const { data: profs } = await admin
      .from("profiles")
      .select("user_id, onesignal_player_id")
      .in("user_id", userIds)
      .not("onesignal_player_id", "is", null);

    const playerIds = (profs ?? []).map((p: any) => p.onesignal_player_id as string).filter(Boolean);
    if (playerIds.length > 0) {
      const body: Record<string, unknown> = {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: payload.title, fr: payload.title },
        contents: { en: payload.message, fr: payload.message },
        chrome_web_icon: "https://joiedevivre-africa.com/pwa-192x192.png",
        data: { ...(payload.data ?? {}), type: payload.type || payload.category },
      };
      if (payload.url) body.url = payload.url;

      try {
        const resp = await fetch(ONESIGNAL_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${restApiKey}`,
          },
          body: JSON.stringify(body),
        });
        const json: any = await resp.json().catch(() => ({}));
        sent = Number(json.recipients ?? 0);
        onesignalId = json.id ?? null;
      } catch (e) {
        console.warn("OneSignal push failed:", e);
      }
    }
  }

  // 3) Analytics
  const analyticsRows = userIds.map((uid) => ({
    user_id: uid,
    notification_type: "push",
    category: payload.category ?? "other",
    title: payload.title,
    body: payload.message,
    action_url: payload.url ?? null,
    status: "sent",
    device_type: "web",
  }));
  await admin.from("notification_analytics").insert(analyticsRows);

  return { sent, in_app: userIds.length, onesignal_id: onesignalId };
}