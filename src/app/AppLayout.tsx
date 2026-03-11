import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
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
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
            <SidebarTrigger />
            <div className="text-sm font-semibold text-foreground">Streamfly Control</div>
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
      </div>
    </SidebarProvider>
  );
}
