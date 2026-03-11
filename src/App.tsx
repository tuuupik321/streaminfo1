import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { type ClipItem, type DashboardStats, type NotificationItem, type StreamItem } from "./ui/dashboard";
import { AppLayout } from "./app/AppLayout";
import { ThemeProvider } from "./components/ThemeProvider";
import { I18nProvider } from "./lib/i18n";
import AdminPage from "./pages/AdminPage";
import Analytics from "./pages/Analytics";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import BridgeTransferPage from "./pages/BridgeTransferPage";
import DesignAgentPage from "./pages/DesignAgentPage";
import DonationsPage from "./pages/DonationsPage";
import Index from "./pages/Index";
import IntegrationsPage from "./pages/IntegrationsPage";
import LiveDashboardPage from "./pages/LiveDashboardPage";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/SettingsPage";
import StreamInfoPage from "./pages/StreamInfoPage";
import SupportPage from "./pages/SupportPage";
import { NewDashboardPage } from "./pages/NewDashboardPage";

const App = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [streamSeries, setStreamSeries] = useState<Array<{ date: string; count: number }>>([]);
  const userId = useMemo(() => getOrCreateUserId(), []);
  const queryClient = useMemo(() => new QueryClient(), []);

  const theme = useMemo(() => (profile ? getThemeByPlatform(profile.platform) : null), [profile]);

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--platform-accent", theme.colors.accent);
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
      setError("Не удалось подтвердить канал, показан демо-режим");
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            {!profile ? (
              <Routes>
                <Route
                  path="/"
                  element={
                    <div className="app-shell">
                      <ConnectScreen onConnect={handleConnect} />
                      {error ? <div className="global-error">{error}</div> : null}
                    </div>
                  }
                />
                <Route path="/design-agent" element={<DesignAgentPage />} />
                <Route path="/legacy" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            ) : (
              <AppLayout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      theme ? (
                        <NewDashboardPage
                          theme={theme}
                          profile={profile}
                          stats={stats}
                          streams={streams}
                          clips={clips}
                          notifications={notifications}
                          streamSeries={streamSeries}
                          onReconnect={handleReconnect}
                        />
                      ) : null
                    }
                  />
                  <Route path="/info" element={<StreamInfoPage />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/donations" element={<DonationsPage />} />
                  <Route path="/announcements" element={<AnnouncementsPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/live" element={<LiveDashboardPage />} />
                  <Route path="/bridge" element={<BridgeTransferPage />} />
                  <Route path="/design-agent" element={<DesignAgentPage />} />
                  <Route path="/legacy" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            )}
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
