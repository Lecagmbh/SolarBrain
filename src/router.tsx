import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import RequireAuth from "./pages/RequireAuth";
import AdminLayout from "./components/layout/AdminLayout";
import { RoleGuard } from "./components/auth/RoleGuard";
import { TrackingProvider } from "./contexts/TrackingContext";

// Electron/Desktop uses HashRouter (file:// protocol), web uses BrowserRouter
const AppRouterProvider = import.meta.env.VITE_ELECTRON === "true" ? HashRouter : BrowserRouter;

// ─── Public Pages (direct import - needed immediately) ───────────────────────
import LoginPage from "./modules/auth/LoginPage";
import ForgotPasswordPage from "./modules/auth/ForgotPasswordPage";
import ResetPasswordPage from "./modules/auth/ResetPasswordPage";
import VerifyEmailPage from "./modules/auth/VerifyEmailPage";
import ResendVerificationPage from "./modules/auth/ResendVerificationPage";
import LandingPage from "./pages/LandingPage";
import AGBPage from "./pages/AGBPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import ImpressumPage from "./pages/ImpressumPage";
import DownloadPage from "./pages/DownloadPage";
import PublicFormularPage from "./pages/PublicFormularPage";

const UploadPortalPage = lazy(() => import("./features/upload-portal/UploadPortalPage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));
const UnternehmenPage = lazy(() => import("./pages/UnternehmenPage"));
// VDE4110FormularePage entfernt (dead import)

// ─── Baunity D2D Pages ───────────────────────────────────────────────────────
const MapPage = lazy(() => import("./features/map/MapPage"));
const LeadWizard = lazy(() => import("./pages/AnlagenWizardPage"));

// ─── Lazy-loaded Admin Pages ─────────────────────────────────────────────────
const Dashboard = lazy(() => import("./modules/dashboard/Dashboard"));
// Netzanmeldungen (admin wrapper): ARCHIVED
// NetzanmeldungenEnterprise: ARCHIVED
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const KundenPage = lazy(() => import("./pages/admin/KundenPage"));
const UsersPageNew = lazy(() => import("./features/users/UsersPage"));
const DokumenteMatrix = lazy(() => import("./pages/admin/DokumenteMatrix"));
const AnlagenWizardPage = lazy(() => import("./pages/AnlagenWizardPage"));
const NetzbetreiberCenterPage = lazy(() => import("./pages/NetzbetreiberCenterPage"));
// UserManagementPage entfernt (dead import)
const RechnungenPage = lazy(() => import("./pages/RechnungenPage"));
const KundenRechnungenPage = lazy(() => import("./pages/KundenRechnungenPage"));
const EmailCommandCenter = lazy(() => import("./pages/EmailCommandCenter"));
const DokumentenCenterPage = lazy(() => import("./pages/DokumentenCenterPage"));
const ArchivPage = lazy(() => import("./pages/ArchivPage"));
const RegelnPage = lazy(() => import("./pages/RegelnPage"));
const LogsPage = lazy(() => import("./pages/LogsPage"));
const CompanySettingsPage = lazy(() => import("./pages/CompanySettingsPage"));
const MyCompanySettingsPage = lazy(() => import("./pages/MyCompanySettingsPage"));
const ImportPage = lazy(() => import("./pages/Importpage"));
const ProdukteDatenbankPage = lazy(() => import("./pages/ProdukteDatenbankPage"));
const ProjektePage = lazy(() => import("./pages/ProjektePage"));
const ProjektDetailPage = lazy(() => import("./pages/ProjektDetailPage"));
const AdminCenterPage = lazy(() => import("./admin-center").then(m => ({ default: m.AdminCenterPage })));
const IntelligenceDashboard = lazy(() => import("./pages/IntelligenceDashboard"));
// Deaktiviert – Alert-System wird komplett überarbeitet
// const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const HvCenterPage = lazy(() => import("./features/hv-center").then(m => ({ default: m.HvCenterPage })));
const HvContractPage = lazy(() => import("./features/hv-center/components/HvContractPage"));
const HandelsvertreterPage = lazy(() => import("./features/admin/handelsvertreter").then(m => ({ default: m.HandelsvertreterPage })));
const CrmCenterPage = lazy(() => import("./features/crm-center/CrmCenterPage"));
const CrmAccessGuard = lazy(() => import("./features/crm-center/CrmAccessGuard"));
// ProjekteUnifiedPage entfernt — CRM wird in bestehende Seiten integriert
const TicketCenterPage = lazy(() => import("./features/tickets/TicketCenterPage"));
const CrmPricingPage = lazy(() => import("./features/crm-center/components/CrmPricingPage"));
const MockVerknuepfung = lazy(() => import("./features/netzanmeldungen/components/detail/MockVerknuepfung"));
const MockNetzanmeldungen = lazy(() => import("./features/netzanmeldungen/components/MockNetzanmeldungen"));
const DashboardMock = lazy(() => import("./modules/dashboard/DashboardMock"));
const MockAbrechnung = lazy(() => import("./features/netzanmeldungen/components/MockAbrechnung"));
const MockKommentarSystem = lazy(() => import("./features/crm-center/MockKommentarSystem"));
// NetzanmeldungenMockV3: ARCHIVED
// MockDetailTabs: ARCHIVED
const MockDetailPanelV2 = lazy(() => import("./features/netzanmeldungen/MockDetailPanelV2"));
const MockDetailPanelV3 = lazy(() => import("./features/netzanmeldungen/MockDetailPanelV3"));
const DetailPanelLive = lazy(() => import("./features/netzanmeldungen/DetailPanelLive"));
// NetzanmeldungenV2: ARCHIVED
const NetzanmeldungenV3 = lazy(() => import("./features/netzanmeldungen/NetzanmeldungenV3"));
const ProvisionenPage = lazy(() => import("./features/admin/provisionen").then(m => ({ default: m.ProvisionenPage })));
const CalendarPage = lazy(() => import("./features/calendar").then(m => ({ default: m.CalendarPage })));
const ZaehlerwechselCenterPage = lazy(() => import("./features/netzanmeldungen/components/ZaehlerwechselCenter").then(m => ({ default: m.ZaehlerwechselCenter })));
const BookingPage = lazy(() => import("./features/calendar").then(m => ({ default: m.BookingPage })));
const CancelPage = lazy(() => import("./features/calendar").then(m => ({ default: m.CancelPage })));
// WhatsAppIntegrationPage entfernt – Feature noch nicht ausgereift
const AccountingPage = lazy(() => import("./features/accounting").then(m => ({ default: m.AccountingPage })));
const FinanzenPage = lazy(() => import("./features/finanzen").then(m => ({ default: m.FinanzenPage })));
// PanelTestPage: ARCHIVED
// WorkflowRouter entfernt – ersetzt durch Ops Center
// VDEFormularePage entfernt (dead import)
const EmailInboxPage = lazy(() => import("./modules/admin/emails/EmailsPage"));
// Deaktiviert – wird neu konzipiert
// const EmailLearningCenter = lazy(() => import("./pages/admin/EmailLearningCenter"));
// const NbResponsePage = lazy(() => import("./pages/NbResponsePage"));
// PortalUsersPage entfernt - integriert in KundenPage
const OfflineBriefcasePage = lazy(() => import("./components/desktop/OfflineBriefcase"));
// AufgabenPage entfernt – ersetzt durch Ops Center
const KundenOnboardingPage = lazy(() => import("./pages/KundenOnboardingPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const FactroCenterPage = lazy(() => import("./pages/FactroCenterPage"));
const OPCenterOPPage = lazy(() => import("./pages/OPCenterPage"));
const EventsAdminPage = lazy(() => import("./features/admin/events/EventsAdminPage"));
const LeaderboardPage = lazy(() => import("./features/leaderboard/LeaderboardPage"));

// NB-Portal
const NbPortalAuswahl = lazy(() => import("./features/nb-portal").then(m => ({ default: m.NbPortalAuswahl })));
const DynamicFormPage = lazy(() => import("./features/nb-portal").then(m => ({ default: m.DynamicFormPage })));
const ProxyFormPage = lazy(() => import("./features/nb-portal").then(m => ({ default: m.ProxyFormPage })));

// ─── Lazy-loaded Portal Pages ────────────────────────────────────────────────
const PortalProvider = lazy(() => import("./portal").then(m => ({ default: m.PortalProvider })));
const PortalLayout = lazy(() => import("./portal").then(m => ({ default: m.PortalLayout })));
const PortalLoginPage = lazy(() => import("./portal").then(m => ({ default: m.PortalLoginPage })));
const PortalForgotPasswordPage = lazy(() => import("./portal").then(m => ({ default: m.PortalForgotPasswordPage })));
const PortalDashboardPage = lazy(() => import("./portal").then(m => ({ default: m.PortalDashboardPage })));
const PortalMessagesPage = lazy(() => import("./portal").then(m => ({ default: m.PortalMessagesPage })));
const PortalDocumentsPage = lazy(() => import("./portal").then(m => ({ default: m.PortalDocumentsPage })));
const PortalSettingsPage = lazy(() => import("./portal").then(m => ({ default: m.PortalSettingsPage })));
const PortalNotificationsPage = lazy(() => import("./portal").then(m => ({ default: m.PortalNotificationsPage })));
// PortalInvoicesPage ENTFERNT: Endkunden dürfen keine Rechnungen sehen
const OnboardingPage = lazy(() => import("./portal").then(m => ({ default: m.OnboardingPage })));
const PortalImpersonatePage = lazy(() => import("./portal/pages/ImpersonatePage"));
const PortalRequireAuth = lazy(() => import("./portal/PortalRequireAuth"));

// Redirect to external static page (served by nginx, not React)
const ExternalWizardRedirect = () => {
  // Full page redirect — works in both browser and WebView
  window.location.replace("/wizard");
  return null;
};

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#060b18]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-zinc-400 text-sm">Lädt...</span>
    </div>
  </div>
);

// Auto-Logout: nur useAutoLogout hook (utils/autoLogout.ts deaktiviert — lief doppelt)

// Wrapper for lazy pages
const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// Kunden sehen KundenRechnungenPage, Staff sieht Admin-RechnungenPage
function RechnungenRouteSwitch() {
  const stored = localStorage.getItem("user");
  const role = stored ? (JSON.parse(stored).role || "").toUpperCase() : "";
  const isStaff = role === "ADMIN" || role === "MITARBEITER";
  return isStaff ? <RechnungenPage /> : <KundenRechnungenPage />;
}

export default function AppRouter() {
  return (
    <AppRouterProvider>
      <TrackingProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/agb" element={<AGBPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/termin" element={<L><BookingPage /></L>} />
        <Route path="/termin/absagen" element={<L><CancelPage /></L>} />
        <Route path="/pay/:token" element={<L><PaymentPage /></L>} />
        <Route path="/formular/:slug" element={<PublicFormularPage />} />
        <Route path="/wizard" element={<ExternalWizardRedirect />} />
        <Route path="/upload/:token" element={<L><UploadPortalPage /></L>} />
        <Route path="/partner" element={<L><PartnerPage /></L>} />
        <Route path="/unternehmen" element={<L><UnternehmenPage /></L>} />
            {/* <Route path="/vde-formulare-4110" element={<L><VDE4110FormularePage /></L>} /> */}
            <Route path="/vde-formulare-4110" element={<Navigate to="/login" replace />} />
        <Route element={<RequireAuth />}>
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
          <Route path="/onboarding" element={<L><KundenOnboardingPage /></L>} />
          <Route path="/hv-center/vertrag" element={<L><HvContractPage /></L>} />
          <Route element={<AdminLayout />}>
            {/* Alle Rollen */}
            {/* PanelTestPage: ARCHIVED */}
            <Route path="/dashboard" element={<L><DashboardMock /></L>} />
            <Route path="/map" element={<L><MapPage /></L>} />
            <Route path="/lead/new" element={<L><LeadWizard /></L>} />
            <Route path="/netzanmeldungen" element={<L><NetzanmeldungenV3 /></L>} />
            <Route path="/netzanmeldungen/:id" element={<L><DetailPanelLive /></L>} />
            {/* V2/V3/Legacy: Redirects auf aktuelle Version */}
            <Route path="/netzanmeldungen-v2" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/netzanmeldungen-v2/:id" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/netzanmeldungen-v3" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/netzanmeldungen-v3/:id" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/netzanmeldungen-legacy" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/anlagen-wizard" element={<L><AnlagenWizardPage /></L>} />
            <Route path="/dokumente" element={<L><DokumentenCenterPage /></L>} />
            <Route path="/rechnungen" element={<L><RechnungenRouteSwitch /></L>} />
            {/* /whatsapp entfernt – Feature noch nicht ausgereift */}
            <Route path="/archiv" element={<L><ArchivPage /></L>} />
            <Route path="/settings/me" element={<L><MyCompanySettingsPage /></L>} />
            {/* /calendar entfernt */}
            <Route path="/hv-center" element={<L><HvCenterPage /></L>} />
            <Route path="/leaderboard" element={<L><LeaderboardPage /></L>} />
            {/* Deaktiviert – Alert-System wird komplett überarbeitet */}
            <Route path="/produkte-db" element={<L><ProdukteDatenbankPage /></L>} />
            <Route path="/projekte" element={<L><ProjektePage /></L>} />
            <Route path="/projekte/:id" element={<L><ProjektDetailPage /></L>} />

            {/* Staff-only: ADMIN + MITARBEITER */}
            <Route path="/zaehlerwechsel-center" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><ZaehlerwechselCenterPage /></L></RoleGuard>} />
            {/* netzanmeldungen-legacy: ARCHIVED, redirect */}
            <Route path="/netzbetreiber" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><NetzbetreiberCenterPage /></L></RoleGuard>} />
            <Route path="/kunden" element={<RoleGuard allowed={['ADMIN', 'MANAGER', 'MITARBEITER']}><L><UsersPageNew /></L></RoleGuard>} />
            <Route path="/kunden-alt" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><KundenPage /></L></RoleGuard>} />
            <Route path="/benutzer" element={<RoleGuard allowed={['ADMIN', 'MANAGER', 'MITARBEITER', 'KUNDE']}><L><UsersPageNew /></L></RoleGuard>} />
            <Route path="/emails" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><EmailCommandCenter /></L></RoleGuard>} />
            <Route path="/dokumente/matrix" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><DokumenteMatrix /></L></RoleGuard>} />
            <Route path="/logs" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><LogsPage /></L></RoleGuard>} />
            <Route path="/regeln" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><RegelnPage /></L></RoleGuard>} />
            <Route path="/settings/company" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><CompanySettingsPage /></L></RoleGuard>} />
            <Route path="/import" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><ImportPage /></L></RoleGuard>} />
            <Route path="/email-inbox" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><EmailInboxPage /></L></RoleGuard>} />
            {/* Deaktiviert – wird neu konzipiert */}
            <Route path="/finanzen" element={<RoleGuard allowed={['ADMIN', 'MANAGER']}><L><FinanzenPage /></L></RoleGuard>} />
            <Route path="/accounting" element={<Navigate to="/finanzen" replace />} />
            <Route path="/op-center" element={<Navigate to="/finanzen?tab=offene-posten" replace />} />
            <Route path="/nb-portal/:portalId" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><NbPortalAuswahl /></L></RoleGuard>} />
            <Route path="/nb-portal/:portalId/form/:typeId" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><ProxyFormPage /></L></RoleGuard>} />
            <Route path="/nb-portal/:portalId/dynamic/:typeId" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><DynamicFormPage /></L></RoleGuard>} />

            {/* Admin-only */}
            <Route path="/admin/center" element={<RoleGuard allowed={['ADMIN']}><L><AdminCenterPage /></L></RoleGuard>} />
            <Route path="/analytics" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><Analytics /></L></RoleGuard>} />
            <Route path="/intelligence" element={<RoleGuard allowed={['ADMIN']}><L><IntelligenceDashboard /></L></RoleGuard>} />
            <Route path="/admin/handelsvertreter" element={<RoleGuard allowed={['ADMIN', 'MANAGER']}><L><HandelsvertreterPage /></L></RoleGuard>} />
            <Route path="/admin/provisionen" element={<RoleGuard allowed={['ADMIN', 'MANAGER']}><L><ProvisionenPage /></L></RoleGuard>} />
            <Route path="/admin/events" element={<RoleGuard allowed={['ADMIN', 'MANAGER']}><L><EventsAdminPage /></L></RoleGuard>} />
            {/* /op-center redirect bereits oben definiert */}
            <Route path="/factro-center" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/crm" element={<Navigate to="/netzanmeldungen" replace />} />
            <Route path="/mock/verknuepfung" element={<L><MockVerknuepfung /></L>} />
            <Route path="/mock/netzanmeldungen" element={<MockNetzanmeldungen />} />
            <Route path="/mock/dashboard" element={<L><DashboardMock /></L>} />
            <Route path="/mock/abrechnung" element={<L><MockAbrechnung /></L>} />
            <Route path="/mock/kommentare" element={<L><MockKommentarSystem /></L>} />
            {/* NetzanmeldungenMockV3: ARCHIVED */}
            {/* MockDetailTabs: ARCHIVED */}
            <Route path="/mock/detail-v2" element={<L><MockDetailPanelV2 /></L>} />
            <Route path="/mock/detail-v3" element={<L><MockDetailPanelV3 /></L>} />
            <Route path="/v2/netzanmeldungen" element={<Navigate to="/netzanmeldungen" replace />} />
            {/* /ticket-center entfernt */}
            {/* DetailPanelLive wird oben unter /netzanmeldungen/:id registriert */}
            <Route path="/pricing" element={<L><CrmPricingPage /></L>} />
            <Route path="/portal-users" element={<Navigate to="/kunden" replace />} />
            <Route path="/offline" element={<RoleGuard allowed={['ADMIN', 'MITARBEITER']}><L><OfflineBriefcasePage /></L></RoleGuard>} />
          </Route>
        </Route>

        {/* ENDKUNDEN-PORTAL */}
        <Route path="/portal/login" element={<L><PortalLoginPage /></L>} />
        <Route path="/portal/forgot-password" element={<L><PortalForgotPasswordPage /></L>} />
        <Route path="/portal/impersonate" element={<L><PortalImpersonatePage /></L>} />

        <Route element={<L><PortalRequireAuth /></L>}>
          <Route element={<L><PortalProvider><PortalLayout /></PortalProvider></L>}>
            <Route path="/portal" element={<L><PortalDashboardPage /></L>} />
            <Route path="/portal/messages" element={<L><PortalMessagesPage /></L>} />
            <Route path="/portal/documents" element={<L><PortalDocumentsPage /></L>} />
            {/* Rechnungen-Route ENTFERNT: Endkunden dürfen keine Rechnungen sehen */}
            <Route path="/portal/settings" element={<L><PortalSettingsPage /></L>} />
            <Route path="/portal/notifications" element={<L><PortalNotificationsPage /></L>} />
          </Route>
          <Route path="/portal/onboarding" element={<L><OnboardingPage /></L>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </TrackingProvider>
    </AppRouterProvider>
  );
}
