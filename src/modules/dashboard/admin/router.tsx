/**
 * ROUTER v3.0
 * Centralized routing configuration
 */

import React, { Suspense, lazy } from "react";
import { createBrowserRouter, createHashRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";

// Lazy load pages
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const Analytics = lazy(() => import("./features/analytics/Analytics"));
const WorkflowAutomation = lazy(() => import("./features/automation/WorkflowAutomation"));

// Loading fallback
const PageLoader = () => (
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    height: "100vh",
    color: "var(--text-muted)"
  }}>
    Laden...
  </div>
);

// Wrap lazy components
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Create and export the router instance
const createRouter = import.meta.env.VITE_ELECTRON === "true" ? createHashRouter : createBrowserRouter;

export const router = createRouter([
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      // Dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: withSuspense(Dashboard) },
      
      // Features
      { path: "analytics", element: withSuspense(Analytics) },
      { path: "automation", element: withSuspense(WorkflowAutomation) },
      
      // Catch-all redirect
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

// Create router with user context
export const createAdminRouter = (user: { name: string; email: string; role: string } | null) => {
  return createRouter([
    {
      path: "/",
      element: <AdminLayout user={user || undefined} />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: "dashboard", element: withSuspense(Dashboard) },
        { path: "analytics", element: withSuspense(Analytics) },
        { path: "automation", element: withSuspense(WorkflowAutomation) },
        { path: "*", element: <Navigate to="/dashboard" replace /> },
      ],
    },
  ]);
};

// Route configuration for integration with existing app
export const adminRoutes = [
  { path: "/dashboard", component: Dashboard },
  { path: "/analytics", component: Analytics },
  { path: "/automation", component: WorkflowAutomation },
];

export default router;
