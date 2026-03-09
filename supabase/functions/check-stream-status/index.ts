import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatusResult {
  platform: string;
  username: string;
  isLive: boolean;
  viewerCount?: number;
  title?: string;
  thumbnailUrl?: string;
}

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
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`);
  const data = await res.json();
  twitchToken = data.access_token;
  twitchTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return twitchToken!;
}

async function checkTwitch(username: string): Promise<StatusResult> {
  const token = await getTwitchToken();
  const clientId = Deno.env.get("TWITCH_CLIENT_ID")!;

  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(username)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": clientId,
      },
    }
  );
  if (!res.ok) throw new Error(`Twitch API error: ${res.status}`);
  const data = await res.json();
  const stream = data.data?.[0];

  return {
    platform: "twitch",
    username,
    isLive: !!stream,
    viewerCount: stream?.viewer_count,
    title: stream?.title,
    thumbnailUrl: stream?.thumbnail_url
      ?.replace("{width}", "320")
      .replace("{height}", "180"),
  };
}

// ── YouTube helpers ─────────────────────────────────────────────
async function checkYouTube(channelId: string): Promise<StatusResult> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  // channelId could be @handle or channel ID
  let searchParam: string;
  if (channelId.startsWith("@")) {
    // Resolve handle to channel ID first
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(channelId)}&key=${apiKey}`
    );
    if (!chRes.ok) throw new Error(`YouTube channels API error: ${chRes.status}`);
    const chData = await chRes.json();
    const realId = chData.items?.[0]?.id;
    if (!realId) return { platform: "youtube", username: channelId, isLive: false };
    searchParam = realId;
  } else {
    searchParam = channelId;
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(searchParam)}&eventType=live&type=video&key=${apiKey}`
  );
  if (!res.ok) throw new Error(`YouTube search API error: ${res.status}`);
  const data = await res.json();
  const liveItem = data.items?.[0];

  return {
    platform: "youtube",
    username: channelId,
    isLive: !!liveItem,
    title: liveItem?.snippet?.title,
    thumbnailUrl: liveItem?.snippet?.thumbnails?.medium?.url,
  };
}

// ── Main handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accounts } = await req.json();
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: StatusResult[] = await Promise.all(
      accounts.map(async (acc: { platform: string; username: string }) => {
        try {
          if (acc.platform === "twitch") return await checkTwitch(acc.username);
          if (acc.platform === "youtube") return await checkYouTube(acc.username);
          return { platform: acc.platform, username: acc.username, isLive: false };
        } catch (err) {
          console.error(`Error checking ${acc.platform}/${acc.username}:`, err);
          return { platform: acc.platform, username: acc.username, isLive: false };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-stream-status error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
