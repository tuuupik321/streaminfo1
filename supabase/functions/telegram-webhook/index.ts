import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return new Response(JSON.stringify({ error: "Bot token not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Handle GET — used to set webhook, get channels, get bot info
  if (req.method === "GET") {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "set-webhook") {
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-webhook`;
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-bot-info") {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        return new Response(JSON.stringify({ username: data.result.username, first_name: data.result.first_name }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to get bot info" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-channels") {
      const { data, error } = await supabase
        .from("telegram_channels")
        .select("id, chat_id, channel_name, is_verified, created_at");
      return new Response(JSON.stringify({ channels: data, error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("OK", { headers: corsHeaders });
  }

  // Handle POST — Telegram webhook updates
  if (req.method === "POST") {
    try {
      const update = await req.json();

      // Bot added to a channel/group
      const myChatMember = update.my_chat_member;
      if (myChatMember) {
        const chat = myChatMember.chat;
        const newStatus = myChatMember.new_chat_member?.status;
        const ownerUserId = myChatMember.from?.id ?? null;

        // Bot was added as admin/member
        if (
          newStatus === "administrator" ||
          newStatus === "member"
        ) {
          const chatId = String(chat.id);
          const channelName =
            chat.title || chat.username || `Chat ${chat.id}`;

          // Upsert channel
          await supabase.from("telegram_channels").upsert(
            {
              chat_id: chatId,
              channel_name: channelName,
              bot_token: botToken,
              is_verified: true,
              owner_user_id: ownerUserId,
            },
            { onConflict: "chat_id" }
          );
        }

        // Bot was removed/kicked
        if (
          newStatus === "left" ||
          newStatus === "kicked"
        ) {
          await supabase
            .from("telegram_channels")
            .delete()
            .eq("chat_id", String(chat.id));
        }
      }

      return new Response("OK", { headers: corsHeaders });
    } catch (e) {
      console.error("Webhook error:", e);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
