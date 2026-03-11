import { Suspense, lazy, useEffect, useMemo, useState } from "react";
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

const AdminPage = lazy(() => import("./pages/AdminPage"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const BridgeTransferPage = lazy(() => import("./pages/BridgeTransferPage"));
const DesignAgentPage = lazy(() => import("./pages/DesignAgentPage"));
const DonationsPage = lazy(() => import("./pages/DonationsPage"));
const Index = lazy(() => import("./pages/Index"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const LiveDashboardPage = lazy(() => import("./pages/LiveDashboardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StreamInfoPage = lazy(() => import("./pages/StreamInfoPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const NewDashboardPage = lazy(() =>
  import("./pages/NewDashboardPage").then((module) => ({ default: module.NewDashboardPage })),
);

function RouteLoadingState() {
  return (
    <div className="saas-card flex min-h-[220px] items-center justify-center rounded-[28px] border border-border/60 bg-card/75 p-6">
      <div className="space-y-2 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-muted-foreground">Loading</div>
        <div className="text-sm font-medium text-foreground/80">Подгружаем экран...</div>
      </div>
    </div>
  );
}

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
    void loadStats();
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

  const publicRoutes = (
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
  );

  const authenticatedRoutes = (
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
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            {!profile ? (
              <Suspense fallback={<RouteLoadingState />}>{publicRoutes}</Suspense>
            ) : (
              <AppLayout>
                <Suspense fallback={<RouteLoadingState />}>{authenticatedRoutes}</Suspense>
              </AppLayout>
            )}
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
