import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider } from "./theme.jsx";   // ✅ ADD THIS
import { AlertProvider } from "./context/AlertContext.jsx";
import { applySavedTheme } from "./themeManager";

applySavedTheme();


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AlertProvider>         {/* ✅ WRAP APP */}
      <ThemeProvider>         {/* ✅ WRAP APP */}
        <App />
      </ThemeProvider>
    </AlertProvider>
  </React.StrictMode>
);
