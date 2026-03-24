import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import Router from "./router";
import { AuthProvider } from "./modules/auth/AuthContext";
import "./index.css";

const AppRouter = import.meta.env.VITE_ELECTRON === "true" ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter>
        <Router />
      </AppRouter>
    </AuthProvider>
  </React.StrictMode>
);
