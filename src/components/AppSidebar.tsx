import { useEffect, useState } from "react";
import { Activity, BarChart3, Info, LifeBuoy, Puzzle, Settings, ShieldCheck, Star, Languages, Moon, Sun, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { getCurrentTelegramId, hasAdminSession, isAdminRole, isOwnerTelegramId } from "@/lib/adminAccess";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";
import { useTheme } from "./ThemeProvider";

type UiTheme = "light" | "dark" | "system";

const mainItems = [
  { key: "dashboard", url: "/", icon: Activity, fallback: "Dashboard" },
  { key: "info", url: "/info", icon: Info, fallback: "Info" },
  { key: "analytics", url: "/analytics", icon: BarChart3, fallback: "Analytics" },
  { key: "donations", url: "/donations", icon: Star, fallback: "Donations" },
  { key: "announcements", url: "/announcements", icon: Megaphone, fallback: "Announcements" },
  { key: "integrations", url: "/integrations", icon: Puzzle, fallback: "Integrations" },
];

function SettingsMenu({ canSeeAdmin, collapsed }: { canSeeAdmin: boolean; collapsed: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { language, setLanguage } = useSettingsStore();
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { title: t("sidebar.settings", "Settings"), url: "/settings", icon: Settings },
    { title: t("sidebar.support", "Support"), url: "/support", icon: LifeBuoy },
  ];

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as UiLanguage);
  };

  const languageSubMenu = (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <Languages size={14} />
        {t("sidebar.language", "Language")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={language} onValueChange={handleLanguageChange}>
          <DropdownMenuRadioItem value="ru">Русский</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  const themeSubMenu = (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
        {t("sidebar.theme", "Theme")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as UiTheme)}>
          <DropdownMenuRadioItem value="light">{t("sidebar.light", "Light")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t("sidebar.dark", "Dark")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t("sidebar.systemTheme", "System")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl border border-white/8 bg-white/[0.04]">
            <Settings size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="ml-2">
          <DropdownMenuLabel>{t("sidebar.systemMenu", "System Menu")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.url} onClick={() => navigate(item.url)} className="gap-2">
              <item.icon size={14} />
              <span>{item.title}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {languageSubMenu}
          {themeSubMenu}
          {canSeeAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2">
                <ShieldCheck size={14} />
                <span>{t("sidebar.adminCenter", "Admin Center")}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
        {t("sidebar.system", "System")}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="flex items-center gap-2 rounded-2xl p-2.5 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {canSeeAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin" className="flex items-center gap-2 rounded-2xl p-2.5 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("sidebar.adminCenter", "Admin Center")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const { t } = useI18n();
  const collapsed = state === "collapsed";
  const currentTelegramId = getCurrentTelegramId();

  const [canSeeAdmin, setCanSeeAdmin] = useState(
    () => isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId),
  );

  useEffect(() => {
    let alive = true;
    const resolveAccess = async () => {
      const bySession = hasAdminSession(currentTelegramId);
      if (!currentTelegramId) {
        if (alive) setCanSeeAdmin(bySession);
        return;
      }
      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("telegram_id", currentTelegramId)
        .maybeSingle();
      if (!alive) return;
      const byTeamRole = isAdminRole(data?.role);
      setCanSeeAdmin(isOwnerTelegramId(currentTelegramId) || bySession || byTeamRole);
    };
    void resolveAccess();
    return () => {
      alive = false;
    };
  }, [currentTelegramId]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60 bg-sidebar/90">
      <SidebarContent className="flex flex-col pt-4">
        <div className="mb-6 flex items-center gap-2.5 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 shadow-[0_14px_32px_rgba(34,197,94,0.12)]">
            <Activity size={18} className="text-primary" />
          </div>
          {!collapsed && (
            <div>
              <span className="block text-base font-black tracking-tight text-foreground">StreamsInfo</span>
              <small className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Telegram Mini App</small>
            </div>
          )}
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("sidebar.menu", "Menu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-[18px] px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]"
                      activeClassName="bg-white/[0.06] text-foreground font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{t(`sidebar.${item.key}`, item.fallback)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto flex flex-col gap-2 px-2 pb-2">
          <SettingsMenu canSeeAdmin={canSeeAdmin} collapsed={collapsed} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
