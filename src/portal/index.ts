/**
 * Portal Module Exports
 */

// Context
export { PortalProvider, usePortal, usePortalInstallation, useNeedsOnboarding } from "./PortalContext";

// Layout
export { PortalLayout } from "./PortalLayout";

// Pages
export { PortalLoginPage } from "./pages/LoginPage";
export { PortalForgotPasswordPage } from "./pages/ForgotPasswordPage";
export { OnboardingPage } from "./pages/OnboardingPage";
export { PortalDashboardPage } from "./pages/DashboardPage";
export { PortalMessagesPage } from "./pages/MessagesPage";
export { PortalDocumentsPage } from "./pages/DocumentsPage";
export { PortalSettingsPage } from "./pages/SettingsPage";
export { NotificationsPage as PortalNotificationsPage } from "./pages/NotificationsPage";
// PortalInvoicesPage ENTFERNT: Endkunden dürfen keine Rechnungen sehen

// Components
export { StatusTimeline } from "./components/StatusTimeline";
export { NotificationBell } from "./components/NotificationBell";
export { InstallationCard } from "./components/InstallationCard";
export { PortalStatusCard } from "./components/PortalStatusCard";
export { EmailModal } from "./components/EmailModal";
// Deaktiviert – Alert-System wird überarbeitet
// export { AlertBanner } from "./components/AlertBanner";

// API
export * from "./api";
