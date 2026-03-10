import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { I18nProvider } from "@/lib/i18n.tsx";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "./components/AppSidebar";
import { CommandPalette } from "./components/CommandPalette";
import { AppShellSkeleton } from "./components/AppShellSkeleton";
import { PageTransition } from "./components/PageTransition";
import { GlobalStatusBar } from "./components/GlobalStatusBar";
import { BottomNav } from "./components/BottomNav";
import { cn } from "./lib/utils";
import { SplashScreen } from "./components/SplashScreen";
import { SettingsModal } from "./components/SettingsModal";
import { Cog } from "lucide-react";

const StreamInfoPage = lazy(() => import("./pages/StreamInfoPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const DonationsPage = lazy(() => import("./pages/DonationsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const DesignAgentPage = lazy(() => import("./pages/DesignAgentPage"));
const BridgeTransferPage = lazy(() => import("./pages/BridgeTransferPage"));
const LiveDashboardPage = lazy(() => import("./pages/LiveDashboardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  enableClosingConfirmation?: () => void;
  themeParams?: {
    bg_color?: string;
  };
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

function TelegramWebAppInit() {
  useEffect(() => {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
    if (tg.themeParams?.bg_color) {
      document.documentElement.style.setProperty("--tg-bg", tg.themeParams.bg_color);
    }
  }, []);

  useEffect(() => {
    const onAccent = (event: Event) => {
      const custom = event as CustomEvent<{ accent?: string }>;
      const accent = custom.detail?.accent;
      if (!accent) return;
      document.documentElement.style.setProperty("--primary", accent);
    };
    window.addEventListener("partner-accent", onAccent);
    return () => window.removeEventListener("partner-accent", onAccent);
  }, []);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/" element={<StreamInfoPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/design-agent" element={<DesignAgentPage />} />
        <Route path="/bridge" element={<BridgeTransferPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/live" element={<LiveDashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <I18nProvider>
          <TelegramWebAppInit />
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <CommandPalette />
            <SidebarProvider>
              <AppShellWithOverlays />
            </SidebarProvider>
          </BrowserRouter>
        </I18nProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

function AppShellWithOverlays() {
  const [showSplash, setShowSplash] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showVpnWarning, setShowVpnWarning] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchVpn = async () => {
      try {
        const response = await fetch("https://ipinfo.io/json");
        const data = await response.json();
        const privacy = data?.privacy || {};
        if (privacy.vpn || privacy.proxy || privacy.tor) {
          setShowVpnWarning(true);
          window.setTimeout(() => setShowVpnWarning(false), 5000);
        }
      } catch {
        // ignore
      }
    };
    void fetchVpn();
  }, []);

  return (
    <>
      <div className="flex min-h-[100dvh] w-full app-shell grain-bg">
                <aside className={cn("hidden md:block", "glass-strong")}>
                  <AppSidebar />
                </aside>
                <div className="flex w-full flex-col min-w-0">
                  <header className={cn("sticky top-0 z-40 h-12 border-b", "glass")}>
                    <div className="mx-auto flex h-full w-full max-w-6xl items-center px-3 sm:px-4">
                      <span className="text-sm font-bold font-heading text-gradient-primary">StreamInfo</span>
                      <button
                        type="button"
                        className="group ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:text-white hover:shadow-[0_0_30px_rgba(145,70,255,0.4)]"
                        onClick={() => setSettingsOpen(true)}
                        aria-label="Open settings"
                      >
                        <Cog size={16} className="transition-transform duration-300 group-active:rotate-12" />
                      </button>
                    </div>
                  </header>
                  <GlobalStatusBar />
                  <main className="flex-1 pb-20 md:pb-6">
                    <Suspense fallback={<AppShellSkeleton />}>
                      <AnimatedRoutes />
                    </Suspense>
                  </main>
                  <BottomNav />
                </div>
              </div>
      {showVpnWarning && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed right-4 top-16 z-[80] rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-100 shadow-[0_0_30px_rgba(245,158,11,0.45)]"
        >
          ⚠️ We detected that you are using a VPN. Streaming data may load slower.
          <button className="ml-3 text-yellow-100/70" onClick={() => setShowVpnWarning(false)}>Close</button>
        </motion.div>
      )}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SplashScreen show={showSplash} />
    </>
  );
}

export default App;
