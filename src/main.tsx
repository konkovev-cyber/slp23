import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppCapacitor from "./AppCapacitor.tsx";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";

// Определяем, запущено ли приложение в нативном контейнере (APK)
const isNative = Capacitor.isNativePlatform();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    {isNative ? <AppCapacitor /> : <App />}
  </HelmetProvider>
);
