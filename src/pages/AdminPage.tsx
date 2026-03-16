import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, Radio, Server, Lock, Crown, BotMessageSquare, Users2, Cog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { PasswordGate } from "@/components/admin/PasswordGate";
import { StatCard } from "@/components/admin/StatCard";
import { AdsSection } from "@/components/admin/AdsSection";
import { BroadcastSection } from "@/components/admin/BroadcastSection";
import { MaintenanceSection } from "@/components/admin/MaintenanceSection";
import { UserManagementSection } from "@/components/admin/UserManagementSection";
import { ServerStatusSection } from "@/components/admin/ServerStatusSection";
import { TeamManagementSection } from "@/components/admin/TeamManagementSection";
import { SupportSection } from "@/components/admin/SupportSection";
import { MonitoringSection } from "@/components/admin/MonitoringSection";
import { AntiSpamSection } from "@/components/admin/AntiSpamSection";
import { AuditLogSection } from "@/components/admin/AuditLogSection";
import { getCurrentTelegramId, setLocalOwnerTelegramId } from "@/lib/adminAccess";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { CardShell } from "@/shared/ui/CardShell";
import { SectionHeader } from "@/shared/ui/SectionHeader";

type AdminRole = "owner" | "moderator" | "analyst" | null;
type AdminOverviewResponse = { users?: number; active_streams?: number; backend_status?: "ok" | "degraded"; ping_ms?: number; error?: string };
type AdminStatsState = { users: number; activeStreams: number; backendStatus: "ok" | "warn" | "error"; ping: string; cpu: string };
type BuildInfo = { commit?: string; build_time?: string; started_at?: string; uptime_seconds?: number };
type TelegramWindow = Window & { Telegram?: { WebApp?: { initData?: string } } };

export default function AdminPage() {
  const currentTelegramId = getCurrentTelegramId();
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_auth") === "true" && Boolean(sessionStorage.getItem("admin_token")));
  const [role, setRole] = useState<AdminRole>(() => (sessionStorage.getItem("admin_role") as AdminRole) || null);
  const [stats, setStats] = useState<AdminStatsState>({ users: 0, activeStreams: 0, backendStatus: "ok", ping: "0ms", cpu: "n/a" });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const buildLabel = buildInfo?.build_time ? new Date(buildInfo.build_time).toLocaleString() : null;

  useEffect(() => {
    if (!currentTelegramId) return;
    setLocalOwnerTelegramId(currentTelegramId);
    sessionStorage.setItem("admin_auth", "true");
    sessionStorage.setItem("admin_telegram_id", currentTelegramId);
    if (!sessionStorage.getItem("admin_role")) sessionStorage.setItem("admin_role", "owner");
    setAuthed(true);
    setRole("owner");
  }, [currentTelegramId]);

  useEffect(() => {
    if (!currentTelegramId) return;
    const resolveRole = async () => {
      const { data } = await supabase.from("team_members").select("role").eq("telegram_id", currentTelegramId).maybeSingle();
      if (data?.role === "owner" || data?.role === "moderator" || data?.role === "analyst") {
        setRole(data.role);
        sessionStorage.setItem("admin_role", data.role);
      }
    };
    void resolveRole();
  }, [currentTelegramId]);

  const canManageSystem = role === "owner";
  const canManageTeam = role === "owner";
  const canManageUsers = role === "owner" || role === "moderator";

  useEffect(() => {
    if (!authed) return;
    const loadSettingsAndStats = async () => {
      const adminToken = sessionStorage.getItem("admin_token");
      const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
      const publicStatusResponse = await fetch("/status");
      if (publicStatusResponse.ok) {
        const statusPayload = await publicStatusResponse.json();
        if (statusPayload?.build) {
          setBuildInfo({
            commit: statusPayload.build?.commit,
            build_time: statusPayload.build?.build_time,
            started_at: statusPayload.started_at,
            uptime_seconds: statusPayload.uptime_seconds,
          });
        }
      }
      if (adminToken && initData) {
        let cpuValue = "n/a";
        const statusResponse = await fetch(`/api/system_status?init_data=${encodeURIComponent(initData)}`);
        if (statusResponse.ok) {
          const statusPayload = await statusResponse.json();
          if (typeof statusPayload?.cpu === "number") {
            cpuValue = `${Math.round(statusPayload.cpu)}%`;
          }
        }
        const overviewResponse = await fetch(`/api/admin/overview?admin_token=${encodeURIComponent(adminToken)}&init_data=${encodeURIComponent(initData)}`);
        if (!overviewResponse.ok) {
          sessionStorage.removeItem("admin_auth");
          sessionStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_role");
          setAuthed(false);
          setRole(null);
          return;
        }
        const overview: AdminOverviewResponse = await overviewResponse.json();
        setStats({
          users: overview.users ?? 0,
          activeStreams: overview.active_streams ?? 0,
          backendStatus: overview.backend_status === "degraded" ? "warn" : "ok",
          ping: `${overview.ping_ms ?? 0}ms`,
          cpu: cpuValue,
        });
      }
      const { data } = await supabase.from("settings").select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
        setMaintenanceMode(map.maintenance_mode === "true");
      }
    };
    void loadSettingsAndStats();
  }, [authed]);

  const handleAuth = (_detectedRole: AdminRole) => {
    setAuthed(true);
    setRole("owner");
    sessionStorage.setItem("admin_role", "owner");
    sessionStorage.setItem("admin_telegram_id", currentTelegramId || "");
  };

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("settings").select("id").eq("key", key).single();
    if (existing) await supabase.from("settings").update({ value }).eq("key", key);
    else await supabase.from("settings").insert({ key, value });
  };

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 sm:p-4 md:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
          <Crown size={22} className="text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading">Админ-центр</h1>
          <p className="text-sm text-muted-foreground font-mono">Панель управления StreamInfo</p>
        </div>
        <Badge variant="outline" className="ml-auto font-mono text-xs border-yellow-500/30 text-yellow-500">
          <Crown size={10} className="mr-1" /> Владелец
        </Badge>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          <StatCard icon={Users} label="Всего пользователей" value={stats.users} />
          <StatCard icon={Radio} label="Активные стримы" value={stats.activeStreams} />
          <StatCard icon={Server} label="Пинг бэкенда" value={stats.ping} status={stats.backendStatus} />
          <StatCard icon={Server} label="Загрузка CPU" value={stats.cpu} status="ok" />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <CardShell className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary/90">
            <Crown size={12} /> Следующий шаг
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Сначала проверь поддержку и свежие обращения, затем рассылки и только после этого системные действия. Так админка остаётся рабочим инструментом, а не складом кнопок.
          </p>
        </CardShell>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-secondary/30 p-1 sm:p-1.5 rounded-xl">
            <TabsTrigger value="content" className="gap-1.5 text-xs font-mono data-[state=active]:bg-background"><BotMessageSquare size={12} /> Контент</TabsTrigger>
            <TabsTrigger value="community" className="gap-1.5 text-xs font-mono data-[state=active]:bg-background"><Users2 size={12} /> Сообщество</TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5 text-xs font-mono data-[state=active]:bg-background"><Cog size={12} /> Система</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-6">
            <SectionHeader title="Реклама" subtitle="Контент" />
            <CardShell>
              <AdsSection saveSetting={saveSetting} settings={settings} />
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Рассылка" subtitle="Контент" />
            <CardShell>
              <BroadcastSection />
            </CardShell>
          </TabsContent>

          <TabsContent value="community" className="mt-6 space-y-6">
            <SectionHeader title="Поддержка" subtitle="Сообщество" />
            <CardShell>
              <SupportSection />
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Пользователи" subtitle="Сообщество" />
            <CardShell>
              {canManageUsers ? <UserManagementSection /> : <p className="text-sm text-muted-foreground">Недостаточно прав</p>}
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Антиспам" subtitle="Сообщество" />
            <CardShell>
              <AntiSpamSection saveSetting={saveSetting} settings={settings} />
            </CardShell>
          </TabsContent>

          <TabsContent value="system" className="mt-6 space-y-6">
            <SectionHeader title="Мониторинг" subtitle="Система" />
            <CardShell>
              <MonitoringSection />
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Обслуживание" subtitle="Система" />
            <CardShell>
              {canManageSystem ? <MaintenanceSection maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} saveSetting={saveSetting} /> : <p className="text-sm text-muted-foreground">Недостаточно прав</p>}
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Статус сервера" subtitle="Система" />
            <CardShell>
              <ServerStatusSection />
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Команда" subtitle="Система" />
            <CardShell>
              {canManageTeam ? <TeamManagementSection /> : <p className="text-sm text-muted-foreground">Недостаточно прав</p>}
            </CardShell>
            <Separator className="border-border/30" />
            <SectionHeader title="Аудит" subtitle="Система" />
            <CardShell>
              <AuditLogSection />
            </CardShell>
          </TabsContent>
        </Tabs>
      </motion.div>

      <div className="pt-4 pb-8">
        <Button variant="ghost" className="text-muted-foreground font-mono text-xs gap-2" onClick={() => {
          sessionStorage.removeItem("admin_auth");
          sessionStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_telegram_id");
          sessionStorage.removeItem("admin_role");
          setAuthed(false);
          setRole(null);
        }}>
          <Lock size={12} /> Выйти из админки
        </Button>
        {buildInfo ? (
          <div className="mt-2 text-[11px] font-mono text-muted-foreground">
            Build {buildInfo.commit ?? "n/a"}{buildLabel ? ` · ${buildLabel}` : ""}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
