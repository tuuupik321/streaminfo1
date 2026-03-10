import { useEffect, useState } from "react";
import { Activity, BarChart3, Info, LifeBuoy, Puzzle, Settings, ShieldCheck, Star, Languages, Moon, Sun, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { PartnerBanner } from "@/components/PartnerBanner";
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

const mainItems = [
  { title: "Информация", url: "/", icon: Info },
  { title: "Аналитика", url: "/analytics", icon: BarChart3 },
  { title: "Донаты", url: "/donations", icon: Star },
  { title: "Анонсы", url: "/announcements", icon: Megaphone },
  { title: "Интеграции", url: "/integrations", icon: Puzzle },
];

function SettingsMenu({ canSeeAdmin, collapsed }: { canSeeAdmin: boolean; collapsed: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { language, setLanguage } = useSettingsStore();
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { title: t("sidebar.settings", "Настройки"), url: "/settings", icon: Settings },
    { title: t("sidebar.support", "Поддержка"), url: "/support", icon: LifeBuoy },
  ];

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as UiLanguage);
  };

  const languageSubMenu = (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <Languages size={14} />
        {t("sidebar.language", "Язык")}
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
        {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
        {t("sidebar.theme", "Тема")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as any)}>
          <DropdownMenuRadioItem value="light">{t("sidebar.light", "Светлая")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t("sidebar.dark", "Темная")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t("sidebar.systemTheme", "Системная")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
            <Settings size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="ml-2">
          <DropdownMenuLabel>{t("sidebar.systemMenu", "Системное меню")}</DropdownMenuLabel>
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
                <span>{t("sidebar.adminCenter", "Админ-центр")}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
        {t("sidebar.system", "Система")}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="flex items-center gap-2 rounded-lg p-2 transition-all duration-200 hover:bg-primary/5 active:scale-[0.98]">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {canSeeAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin" className="flex items-center gap-2 rounded-lg p-2 transition-all duration-200 hover:bg-primary/5 active:scale-[0.98]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("sidebar.adminCenter", "Админ-центр")}</span>
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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="flex flex-col pt-4">
        <div className="mb-6 flex items-center gap-2.5 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <Activity size={18} className="text-primary" />
          </div>
          {!collapsed && (
            <span className="text-gradient-primary text-lg font-black font-heading tracking-tight">
              STREAMSINFO
            </span>
          )}
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
            {t("sidebar.menu", "Меню")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-lg transition-all duration-200 hover:bg-primary/5 active:scale-[0.98]"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{t(`sidebar.${item.title.toLowerCase()}`, item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto flex flex-col gap-2 px-2">
          <SettingsMenu canSeeAdmin={canSeeAdmin} collapsed={collapsed} />
          <PartnerBanner collapsed={collapsed} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
