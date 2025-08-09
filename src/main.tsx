import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BalanceProvider } from "@/contexts/BalanceContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <BalanceProvider>
        <App />
      </BalanceProvider>
    </ThemeProvider>
  </StrictMode>
);