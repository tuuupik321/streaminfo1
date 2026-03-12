import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeShell } from "./lib/nativeShell";

if (!import.meta.env.DEV) {
  console.warn = () => undefined;
}

void initNativeShell();

createRoot(document.getElementById("root")!).render(<App />);
