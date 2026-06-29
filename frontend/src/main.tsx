import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installApiAuthInterceptor } from "./utils/apiClient";

installApiAuthInterceptor();

if (window.desktopAPI?.isDesktop) {
  const originalPrint = window.print.bind(window);
  window.print = () => {
    void window.desktopAPI
      ?.printCurrentWindow({ silent: false, printBackground: true })
      .then((result) => {
        if (!result?.success) {
          originalPrint();
        }
      })
      .catch(() => {
        originalPrint();
      });
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
