import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalStatusBar } from "@/components/GlobalStatusBar";
import { PageTransition } from "@/components/PageTransition";
import { SettingsModal } from "@/components/SettingsModal";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<DOMRect | null>(null);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-svh w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 px-2.5 pt-2.5 md:px-4 md:pt-4">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-background/78 px-3.5 py-2.5 shadow-[0_18px_42px_rgba(3,12,24,0.24)] backdrop-blur-2xl md:px-4 md:py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">Telegram Mini App</div>
                  <div className="text-sm font-semibold text-foreground">StreamsInfo</div>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-muted-foreground md:flex">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(74,222,128,0.55)]" />
                Интерфейс канала
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl px-2.5 pb-28 pt-2.5 md:px-4 md:pb-28 md:pt-4">
            <GlobalStatusBar />
            <PageTransition>{children}</PageTransition>
          </div>
        </SidebarInset>

        <BottomNav
          onOpenSettings={(rect) => {
            setSettingsAnchor(rect ?? null);
            setSettingsOpen(true);
          }}
        />
        <SettingsModal
          open={settingsOpen}
          anchorRect={settingsAnchor}
          onClose={() => setSettingsOpen(false)}
        />
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}
