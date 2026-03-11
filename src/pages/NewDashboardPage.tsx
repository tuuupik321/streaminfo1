import type { UserProfile } from "@/database/users";
import type { PlatformTheme } from "@/ui/themes";
import type { ClipItem, DashboardStats, NotificationItem, StreamItem } from "@/ui/dashboard";
import { Dashboard } from "@/ui/dashboard";

export function NewDashboardPage({
  theme,
  profile,
  stats,
  streams,
  clips,
  notifications,
  streamSeries,
  onReconnect,
}: {
  theme: PlatformTheme;
  profile: UserProfile;
  stats: DashboardStats | null;
  streams: StreamItem[];
  clips: ClipItem[];
  notifications: NotificationItem[];
  streamSeries: Array<{ date: string; count: number }>;
  onReconnect: () => void;
}) {
  return (
    <Dashboard
      theme={theme}
      profile={profile}
      stats={stats}
      streams={streams}
      clips={clips}
      notifications={notifications}
      streamSeries={streamSeries}
      onReconnect={onReconnect}
      showSidebar={false}
    />
  );
}
