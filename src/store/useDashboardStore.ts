import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const ALL_WIDGETS = [
  "stats",
  "viewerChart",
  "liveStreamFeed",
  "partners",
  "liveEvents",
  "predictions",
  "streamSeries",
  "achievements",
] as const;

export type Widget = (typeof ALL_WIDGETS)[number];

interface DashboardState {
  widgets: Widget[];
  addWidget: (widget: Widget) => void;
  removeWidget: (widget: Widget) => void;
  setWidgets: (widgets: Widget[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: ["stats", "viewerChart", "liveStreamFeed"],
      addWidget: (widget) => set((state) => ({ widgets: [...state.widgets, widget] })),
      removeWidget: (widget) => set((state) => ({ widgets: state.widgets.filter((w) => w !== widget) })),
      setWidgets: (widgets) => set({ widgets }),
    }),
    {
      name: "dashboard-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
