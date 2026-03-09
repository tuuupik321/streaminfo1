import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type TelegramChannelRow = {
  chat_id: string;
  bot_token: string | null;
  is_verified: boolean;
};

type MonitorCheckResult = {
  platform: string;
  username: string;
  wasLive?: boolean;
  nowLive?: boolean;
  notified?: boolean;
  error?: string;
};

// ── Twitch helpers ──────────────────────────────────────────────
let twitchToken: string | null = null;
let twitchTokenExpiry = 0;

async function getTwitchToken(): Promise<string> {
  if (twitchToken && Date.now() < twitchTokenExpiry) return twitchToken;
  const clientId = Deno.env.get("TWITCH_CLIENT_ID");
  const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Twitch credentials not configured");

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`);
  const data = await res.json();
  twitchToken = data.access_token;
  twitchTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return twitchToken!;
}

async function checkTwitchLive(username: string): Promise<{ isLive: boolean; title?: string; viewerCount?: number }> {
  const token = await getTwitchToken();
  const clientId = Deno.env.get("TWITCH_CLIENT_ID")!;
  const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${token}`, "Client-Id": clientId },
  });
  if (!res.ok) throw new Error(`Twitch API error: ${res.status}`);
  const data = await res.json();
  const stream = data.data?.[0];
  return { isLive: !!stream, title: stream?.title, viewerCount: stream?.viewer_count };
}

async function checkYouTubeLive(channelId: string): Promise<{ isLive: boolean; title?: string }> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  let searchParam = channelId;
  if (channelId.startsWith("@")) {
    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(channelId)}&key=${apiKey}`);
    if (!chRes.ok) throw new Error(`YouTube channels API error: ${chRes.status}`);
    const chData = await chRes.json();
    searchParam = chData.items?.[0]?.id;
    if (!searchParam) return { isLive: false };
  }

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(searchParam)}&eventType=live&type=video&key=${apiKey}`);
  if (!res.ok) throw new Error(`YouTube search API error: ${res.status}`);
  const data = await res.json();
  const liveItem = data.items?.[0];
  return { isLive: !!liveItem, title: liveItem?.snippet?.title };
}

// ── Telegram notification ───────────────────────────────────────
async function sendTelegramNotification(
  chatIds: string[],
  botTokens: string[],
  platform: string,
  username: string,
  title?: string,
  viewerCount?: number
) {
  const platformLabel = platform === "twitch" ? "Twitch" : "YouTube";
  const emoji = platform === "twitch" ? "🟣" : "🔴";
  const streamUrl = platform === "twitch"
    ? `https://twitch.tv/${username}`
    : username.startsWith("@")
      ? `https://youtube.com/${username}/live`
      : `https://youtube.com/channel/${username}/live`;

  let text = `${emoji} <b>${username}</b> сейчас в эфире на ${platformLabel}!`;
  if (title) text += `\n\n📺 <i>${title}</i>`;
  if (viewerCount) text += `\n👥 ${viewerCount} зрителей`;
  text += `\n\n<a href="${streamUrl}">Смотреть стрим →</a>`;

  const results: string[] = [];

  for (let i = 0; i < chatIds.length; i++) {
    const chatId = chatIds[i];
    const botToken = botTokens[i] || botTokens[0];
    if (!botToken) continue;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
          reply_markup: {
            inline_keyboard: [[
              { text: `▶️ Смотреть на ${platformLabel}`, url: streamUrl },
            ]],
          },
        }),
      });
      const resBody = await res.text();
      results.push(`${chatId}: ${res.ok ? "OK" : resBody}`);
    } catch (err) {
      results.push(`${chatId}: error - ${err}`);
    }
  }

  return results;
}

async function appendEventLog(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("event_logs").insert({
    event_type: eventType,
    message,
    metadata,
  });
  if (error) {
    console.error("Failed to append event log:", error.message);
  }
}

// ── Main handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get all monitors
    const { data: monitors, error: mErr } = await supabase
      .from("stream_monitors")
      .select("*");

    if (mErr) throw new Error(`Failed to fetch monitors: ${mErr.message}`);
    if (!monitors || monitors.length === 0) {
      return new Response(JSON.stringify({ message: "No monitors configured", checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get all telegram channels for notifications
    const { data: channels } = await supabase
      .from("telegram_channels")
      .select("chat_id, bot_token, is_verified")
      .eq("is_verified", true);

    const channelRows = (channels ?? []) as TelegramChannelRow[];
    const chatIds = channelRows.map((c) => c.chat_id);
    const botTokens = channelRows.map((c) => c.bot_token ?? "");

    if (chatIds.length === 0) {
      // Update checked timestamps but skip notifications
      for (const m of monitors) {
        await supabase.from("stream_monitors").update({ last_checked_at: new Date().toISOString() }).eq("id", m.id);
      }
      return new Response(JSON.stringify({ message: "No verified channels", checked: monitors.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check each monitor
    const results: MonitorCheckResult[] = [];

    for (const monitor of monitors) {
      try {
        let status: { isLive: boolean; title?: string; viewerCount?: number };

        if (monitor.platform === "twitch") {
          status = await checkTwitchLive(monitor.username);
        } else if (monitor.platform === "youtube") {
          status = await checkYouTubeLive(monitor.username);
        } else {
          continue;
        }

        const wasOffline = !monitor.is_live;
        const nowLive = status.isLive;
        let notified = false;

        // Transition: offline → live
        if (wasOffline && nowLive) {
          const notifResults = await sendTelegramNotification(
            chatIds, botTokens, monitor.platform, monitor.username, status.title, status.viewerCount
          );
          console.log(`Notified for ${monitor.platform}/${monitor.username}:`, notifResults);
          await appendEventLog(
            supabase,
            "stream_live",
            `${monitor.username} is live on ${monitor.platform}`,
            {
              platform: monitor.platform,
              username: monitor.username,
              title: status.title || null,
              viewers: status.viewerCount ?? null,
              notified_channels: chatIds.length,
            },
          );
          notified = true;
        } else if (!wasOffline && !nowLive) {
          await appendEventLog(
            supabase,
            "stream_end",
            `${monitor.username} stream ended on ${monitor.platform}`,
            {
              platform: monitor.platform,
              username: monitor.username,
            },
          );
        }

        // Update monitor status
        await supabase.from("stream_monitors").update({
          is_live: nowLive,
          last_checked_at: new Date().toISOString(),
          ...(notified ? { last_notified_at: new Date().toISOString() } : {}),
        }).eq("id", monitor.id);

        results.push({
          platform: monitor.platform,
          username: monitor.username,
          wasLive: monitor.is_live,
          nowLive,
          notified,
        });
      } catch (err) {
        console.error(`Error checking ${monitor.platform}/${monitor.username}:`, err);
        await appendEventLog(
          supabase,
          "stream_check_error",
          `Check error for ${monitor.platform}/${monitor.username}`,
          { error: String(err) },
        );
        results.push({ platform: monitor.platform, username: monitor.username, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ checked: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("monitor-streams error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
