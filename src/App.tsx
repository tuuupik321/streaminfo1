import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { detectPlatform, extractChannelName } from "./utils/detectPlatform";
import {
  clearUserProfile,
  getOrCreateUserId,
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from "./database/users";
import { getThemeByPlatform } from "./ui/themes";
import { ConnectScreen } from "./ui/connect";
import {
  Dashboard,
  type ClipItem,
  type DashboardStats,
  type NotificationItem,
  type StreamItem,
} from "./ui/dashboard";

const App = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [streamSeries, setStreamSeries] = useState<Array<{ date: string; count: number }>>([]);
  const userId = useMemo(() => getOrCreateUserId(), []);

  const theme = useMemo(() => (profile ? getThemeByPlatform(profile.platform) : null), [profile]);

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--panel-bg", theme.colors.bg);
  }, [theme]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/channel?user_id=${userId}`);
        if (!res.ok) return;
        const data = (await res.json()) as UserProfile;
        if (data?.connected) {
          saveUserProfile(data);
          setProfile(data);
        }
      } catch {
        // ignore
      }
    };
    void loadProfile();
  }, [userId]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const loadStats = async () => {
      try {
        const res = await fetch(`/api/dashboard_stats?user_id=${userId}`);
        if (res.ok) {
          const data = (await res.json()) as DashboardStats;
          if (active) setStats(data);
        }
        const streamsRes = await fetch(`/api/streams?user_id=${userId}`);
        if (streamsRes.ok) {
          const payload = (await streamsRes.json()) as { items?: StreamItem[] };
          if (active && payload.items) setStreams(payload.items);
        }
        const clipsRes = await fetch(`/api/clips?user_id=${userId}`);
        if (clipsRes.ok) {
          const payload = (await clipsRes.json()) as { items?: ClipItem[] };
          if (active && payload.items) setClips(payload.items);
        }
        const notesRes = await fetch(`/api/notifications?user_id=${userId}`);
        if (notesRes.ok) {
          const payload = (await notesRes.json()) as NotificationItem[];
          if (active) setNotifications(payload);
        }
        const historyRes = await fetch(`/api/stream_history?user_id=${userId}`);
        if (historyRes.ok) {
          const payload = (await historyRes.json()) as { series?: Array<{ date: string; count: number }> };
          if (active && payload.series) setStreamSeries(payload.series);
        }
      } catch {
        // ignore
      }
    };
    loadStats();
    const timer = window.setInterval(loadStats, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [profile, userId]);

  const handleConnect = async (url: string) => {
    try {
      const platform = detectPlatform(url);
      const channelName = extractChannelName(url);
      const fallbackProfile: UserProfile = {
        platform,
        channel_url: url,
        channel_name: channelName,
        connected: true,
      };

      const res = await fetch("/api/channel/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, channel_url: url }),
      });

      if (res.ok) {
        const data = (await res.json()) as UserProfile;
        saveUserProfile(data);
        setProfile(data);
        setError(null);
        return;
      }

      saveUserProfile(fallbackProfile);
      setProfile(fallbackProfile);
      setError("Ќе удалось подтвердить канал, показан демо-режим");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReconnect = () => {
    clearUserProfile();
    setProfile(null);
    setStats(null);
    setStreams([]);
    setClips([]);
    setNotifications([]);
    setStreamSeries([]);
  };

  if (!profile) {
    return (
      <div className="app-shell">
        <ConnectScreen onConnect={handleConnect} />
        {error ? <div className="global-error">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {theme ? (
        <Dashboard
          theme={theme}
          profile={profile}
          stats={stats}
          streams={streams}
          clips={clips}
          notifications={notifications}
          streamSeries={streamSeries}
          onReconnect={handleReconnect}
        />
      ) : null}
      {error ? <div className="global-error">{error}</div> : null}
    </div>
  );
};

export default App;
