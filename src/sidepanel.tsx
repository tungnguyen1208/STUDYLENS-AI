import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { I18nProvider } from "./i18n/index.tsx";
import "./index.css";

// Check if running inside Chrome extension sidepanel
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <I18nProvider initialLanguage="vi">
        <App runtime="extension" />
      </I18nProvider>
    </StrictMode>
  );
}
