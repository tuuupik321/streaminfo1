import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { EventFeed } from "@/features/live-dashboard/components/EventFeed";
import { useLiveEvents } from "@/hooks/useLiveEvents";

export default function LiveDashboardPage() {
  const { t } = useI18n();
  const events = useLiveEvents();

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-2xl font-black font-heading md:text-3xl"
      >
        {t("liveDashboard.title", "Пульт управления стримом")}
      </motion.h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EventFeed events={events} />
        </div>
        <div className="space-y-4">
          {/* Placeholder for Chat Highlights */}
          <div className="card-glass h-64 rounded-xl p-4">
            <h2 className="font-bold font-heading">{t("liveDashboard.chatHighlights", "Вопросы из чата")}</h2>
          </div>
          {/* Placeholder for Quick Actions */}
          <div className="card-glass h-32 rounded-xl p-4">
            <h2 className="font-bold font-heading">{t("liveDashboard.quickActions", "Быстрые действия")}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
