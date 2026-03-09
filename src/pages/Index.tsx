import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, BarChart3, Search, Twitch, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChannelCard } from "@/components/dashboard/ChannelCard";
import { ViewerChart } from "@/components/dashboard/ViewerChart";
import { AddChannelDialog } from "@/components/dashboard/AddChannelDialog";

const initialChannels: { name: string; platform: string; live: boolean; viewers: number }[] = [
  { name: "xQc", platform: "twitch", live: true, viewers: 45200 },
  { name: "shroud", platform: "twitch", live: true, viewers: 18400 },
  { name: "pokimane", platform: "twitch", live: false, viewers: 0 },
  { name: "summit1g", platform: "twitch", live: true, viewers: 9800 },
  { name: "TimTheTatman", platform: "twitch", live: false, viewers: 0 },
];

export default function Index() {
  const [channels, setChannels] = useState<typeof initialChannels>(initialChannels);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [channels, search]
  );

  const stats = {
    live_viewers: channels.filter((c) => c.live).reduce((s, c) => s + (c.viewers || 0), 0),
    total_clicks: 12847,
    peak_viewers: 78420,
  };

  const addChannel = (name: string) => {
    if (!channels.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setChannels([...channels, { name, platform: "twitch", live: false, viewers: 0 }]);
    }
  };

  const deleteChannel = (name: string) => {
    setChannels(channels.filter((c) => c.name !== name));
  };

  return (
    <div className="bg-background p-4 md:p-8 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard icon={Users} label="Live сейчас" value={stats.live_viewers} delay={0} />
        <StatsCard icon={TrendingUp} label="Всего кликов" value={stats.total_clicks} delay={0.1} />
        <StatsCard icon={BarChart3} label="Пик онлайна" value={stats.peak_viewers} delay={0.2} />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <ViewerChart />
      </div>

      {/* Channels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-xl font-bold font-heading">Мои стримеры</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border font-mono text-sm w-full sm:w-56"
              />
            </div>
            <AddChannelDialog onAdd={addChannel} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {Array.isArray(filtered) && filtered.map((chan, i) => (
              <ChannelCard key={chan.name} channel={chan} index={i} onDelete={deleteChannel} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-mono text-sm">
            Стримеры не найдены
          </div>
        )}
      </motion.div>
    </div>
  );
}
