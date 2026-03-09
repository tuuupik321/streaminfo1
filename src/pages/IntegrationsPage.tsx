import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Loader2, Twitch, Youtube } from "lucide-react";

type SettingsData = {
  is_linked: boolean;
  twitch_name: string | null;
  yt_channel_id: string | null;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const fetchSettings = async (userId: number, initData: string): Promise<SettingsData> => {
  const response = await fetch(`/api/settings?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  return response.json();
};

const saveSettings = async (data: { userId: number; initData: string; twitchName: string; ytChannelId: string }) => {
  const response = await fetch("/api/save_settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: data.userId,
      init_data: data.initData,
      twitch_name: data.twitchName,
      yt_channel_id: data.ytChannelId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to save settings");
  }

  return response.json();
};

export default function IntegrationsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [twitchName, setTwitchName] = useState("");
  const [ytChannelId, setYtChannelId] = useState("");

  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["settings", userId],
    queryFn: () => fetchSettings(userId!, initData),
    enabled: !!userId,
    onSuccess: (data) => {
      if (data) {
        setTwitchName(data.twitch_name || "");
        setYtChannelId(data.yt_channel_id || "");
      }
    },
  });

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success(t("integrations.saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      queryClient.invalidateQueries({ queryKey: ["streamInfo"] });
    },
    onError: (error: Error) => {
      const errorMessage = t(`errors.${error.message}`, t("errors.unknown"));
      toast.error(errorMessage);
    },
  });

  const handleSave = () => {
    if (!userId) return;
    mutation.mutate({ userId, initData, twitchName, ytChannelId });
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-black font-heading md:text-3xl">
        {t("integrations.title")}
      </motion.h1>

      <Card className="card-glass">
        <CardHeader>
          <CardTitle>{t("integrations.subtitle")}</CardTitle>
          <CardDescription>{t("integrations.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="twitch" className="flex items-center gap-2 font-mono text-sm">
              <Twitch size={16} /> {t("integrations.twitchLabel")}
            </Label>
            <Input
              id="twitch"
              value={twitchName}
              onChange={(e) => setTwitchName(e.target.value)}
              placeholder={t("integrations.twitchPlaceholder")}
              disabled={isLoading || mutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube" className="flex items-center gap-2 font-mono text-sm">
              <Youtube size={16} /> {t("integrations.youtubeLabel")}
            </Label>
            <Input
              id="youtube"
              value={ytChannelId}
              onChange={(e) => setYtChannelId(e.target.value)}
              placeholder={t("integrations.youtubePlaceholder")}
              disabled={isLoading || mutation.isPending}
            />
          </div>
          <Button onClick={handleSave} disabled={isLoading || mutation.isPending} className="w-full">
            {mutation.isPending ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
            {t("integrations.saveButton")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
