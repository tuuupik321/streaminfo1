import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Users, TrendingUp, BarChart3, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChannelCard } from "@/components/dashboard/ChannelCard";
import { ViewerChart } from "@/components/dashboard/ViewerChart";
import { AddChannelDialog } from "@/components/dashboard/AddChannelDialog";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { CardShell } from "@/shared/ui/CardShell";
import { SectionHeader } from "@/shared/ui/SectionHeader";

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
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  const filtered = useMemo(
    () => channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [channels, search],
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
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl bg-background px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.div variants={item} className="mb-6 rounded-[28px] border border-primary/15 bg-primary/8 p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary/90">
          <Sparkles size={12} /> Legacy preview
        </div>
        <h1 className="mt-4 text-2xl font-black font-heading text-gradient-primary md:text-3xl">Старый экспериментальный dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Этот экран сохранён как reference. Здесь можно сравнить старую плотность карточек и поведение поиска, но основной продуктовый поток уже живёт на новой главной.
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard icon={Users} label="Онлайн сейчас" value={stats.live_viewers} delay={0} />
        <StatsCard icon={TrendingUp} label="Всего переходов" value={stats.total_clicks} delay={0.1} />
        <StatsCard icon={BarChart3} label="Пик интереса" value={stats.peak_viewers} delay={0.2} />
      </motion.div>

      <motion.div variants={item} className="mt-6">
        <CardShell>
          <ViewerChart />
        </CardShell>
      </motion.div>

      <motion.div variants={item} className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader title="Список стримеров" subtitle="Архивная версия экрана" />
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени канала"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-secondary pl-9 font-mono text-sm sm:w-56"
              />
            </div>
            <AddChannelDialog onAdd={addChannel} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {filtered.map((chan, i) => (
              <ChannelCard key={chan.name} channel={chan} index={i} onDelete={deleteChannel} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <CardShell className="mt-4 text-center">
            <p className="text-sm font-semibold text-foreground">Ничего не найдено</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Попробуйте другое имя или добавьте новый канал вручную. После этого карточка сразу появится в списке.
            </p>
          </CardShell>
        )}
      </motion.div>
    </motion.div>
  );
}
