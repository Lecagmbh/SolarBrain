/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Baunity ADMIN PORTAL v3.0                                                      ║
 * ║  Main Application Entry Point                                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

// Styles
import "./styles/design-system.css";
import "./components/ui/ui-components.css";
import "./components/ui/command-palette.css";
import "./components/layout/layout.css";
import "./features/dashboard/dashboard.css";
import "./features/notifications/notifications.css";
import "./features/analytics/analytics.css";
import "./features/automation/automation.css";
import "./features/ai/ai-assistant-local.css";

export const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
