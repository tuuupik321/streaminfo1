import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Heart, Star, UserPlus, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type LiveEvent = {
  id: string;
  type: "follow" | "sub" | "donation" | "raid";
  user: string;
  amount?: number;
  currency?: string;
  tier?: string;
};

const eventIcons = {
  follow: <UserPlus size={16} className="text-blue-500" />,
  sub: <Star size={16} className="text-yellow-500" />,
  donation: <DollarSign size={16} className="text-green-500" />,
  raid: <Users size={16} className="text-purple-500" />,
};

function EventRow({ event }: { event: LiveEvent }) {
  const { t } = useI18n();

  const renderDetails = () => {
    switch (event.type) {
      case "donation":
        return `${event.amount?.toLocaleString()} ${event.currency}`;
      case "sub":
        return t("liveDashboard.tier", "Tier {tier}", { tier: event.tier || "1" });
      case "raid":
        return t("liveDashboard.viewers", "{count} viewers", { count: event.amount || 0 });
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-3 border-b border-border/10"
    >
      <div className="w-6">{eventIcons[event.type]}</div>
      <div className="flex-1">
        <span className="font-semibold">{event.user}</span>
        <span className="text-muted-foreground ml-2 text-sm">
          {t(`liveDashboard.event_${event.type}`, event.type)}
        </span>
      </div>
      <div className="font-mono text-sm font-semibold text-primary">{renderDetails()}</div>
    </motion.div>
  );
}

export function EventFeed({ events }: { events: LiveEvent[] }) {
  const { t } = useI18n();

  return (
    <div className="card-glass h-96 rounded-xl flex flex-col">
      <h2 className="p-4 font-bold font-heading border-b border-border/10">
        {t("liveDashboard.eventFeed", "Лента событий")}
      </h2>
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
