import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function manualChunks(id: string) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("react-router") || id.includes("@remix-run")) {
    return "router-vendor";
  }

  if (id.includes("@tanstack/react-query")) {
    return "query-vendor";
  }

  if (id.includes("recharts") || id.includes("d3-")) {
    return "charts-vendor";
  }

  if (
    id.includes("@radix-ui") ||
    id.includes("framer-motion") ||
    id.includes("lucide-react") ||
    id.includes("embla-carousel-react")
  ) {
    return "ui-vendor";
  }

  if (
    id.includes("react") ||
    id.includes("react-dom") ||
    id.includes("scheduler") ||
    id.includes("use-sync-external-store")
  ) {
    return "react-vendor";
  }

  return "vendor";
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:10000",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: "VITE_",
}));
