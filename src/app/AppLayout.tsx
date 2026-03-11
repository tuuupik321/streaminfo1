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
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/60 bg-background/82 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                  Control deck
                </div>
                <div className="text-sm font-semibold text-foreground">Streamfly Control</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-secondary/35 px-3 py-1.5 text-[11px] font-mono text-muted-foreground md:flex">
              <span className="text-foreground/85">Command Palette</span>
              <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-foreground/75">
                Ctrl K
              </span>
            </div>
          </header>
          <GlobalStatusBar />
          <div className="px-4 pb-28 pt-4">
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
