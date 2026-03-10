import { useEffect, useState } from "react";
import { Activity, BarChart3, Info, LifeBuoy, Puzzle, Settings, ShieldCheck, Star } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { PartnerBanner } from "@/components/PartnerBanner";
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
import { Separator } from "@/components/ui/separator";
import { getCurrentTelegramId, hasAdminSession, isAdminRole, isOwnerTelegramId } from "@/lib/adminAccess";
import { supabase } from "@/integrations/supabase/client";

const mainItems = [
  { title: "Информация", url: "/", icon: Info },
  { title: "Аналитика", url: "/analytics", icon: BarChart3 },
  { title: "Донаты", url: "/donations", icon: Star },
  { title: "Интеграции", url: "/integrations", icon: Puzzle },
];

const secondaryItems = [
  { title: "Поддержка", url: "/support", icon: LifeBuoy },
  { title: "Настройки", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
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
      <SidebarContent className="pt-4">
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
            Меню
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-3 my-2 border-border/20" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="rounded-lg transition-all duration-200 hover:bg-primary/5 active:scale-[0.98]"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canSeeAdmin && (
          <>
            <Separator className="mx-3 my-2 border-border/20" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
                Система
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin"
                        className="rounded-lg transition-all duration-200 hover:bg-primary/5 active:scale-[0.98]"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {!collapsed && <span>Админ-центр</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <div className="mt-auto">
          <PartnerBanner collapsed={collapsed} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
