/**
 * Portal API Client
 * =================
 * API-Calls für das Endkunden-Portal.
 */

import { apiGet, apiPost } from "../api/client";

// Types
export interface PortalInstallation {
  id: number;
  publicId: string;
  nbCaseNumber: string | null;
  customerName: string | null;
  strasse: string | null;
  hausNr: string | null;
  plz: string | null;
  ort: string | null;
  status: string;
  statusLabel: string | null;
  caseType: string | null;
  createdAt: string;
  nbRueckfrageText: string | null;
  nbRueckfrageAm: string | null;
  nbRueckfrageBeantwortet: boolean;
  installateurName: string;
  isPrimary: boolean;
}

export interface PortalInstallationDetail extends PortalInstallation {
  submittedAt: string | null;
  completedAt: string | null;
  nbEingereichtAm: string | null;
  nbGenehmigungAm: string | null;
  technicalData: Record<string, unknown> | null;
  messkonzept: string | null;
  dedicatedEmail: string | null;
  netzbetreiber: { name: string } | null;
  installateurEmail: string;
  installateurTelefon: string;
  endkundenConsent: EndkundenConsent | null;
  kundenfreigabeNoetig?: boolean;
  kundenfreigabeNbName?: string;
  kundenfreigabePortalUrl?: string;
  kundenfreigabeHinweis?: string;
  kundenfreigabeErledigt?: boolean;
}

export interface EndkundenConsent {
  emailConsent: boolean;
  emailConsentAt: string | null;
  whatsappConsent: boolean;
  whatsappConsentAt: string | null;
  whatsappNumber: string | null;
  whatsappVerified: boolean;
  firstLoginAt: string | null;
  onboardingCompleted: boolean;
  portalActivatedAt: string | null;
  lastPortalVisit: string | null;
}

export interface StatusHistoryEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  statusLabel: string;
  comment: string | null;
  createdAt: string;
}

// Neues kombiniertes Timeline-Format (Status + E-Mails + Nachrichten + Dokumente)
export interface TimelineEntry {
  id: string;
  type: "status" | "email" | "message" | "document";
  title: string;
  description: string | null;
  date: string;
  meta?: {
    // Für Status
    fromStatus?: string | null;
    toStatus?: string;
    // Für E-Mails
    emailId?: number;
    direction?: "INBOUND" | "OUTBOUND";
    from?: string;
    fromName?: string;
    preview?: string;
    // Für Nachrichten
    senderType?: string;
    // Für Dokumente
    documentId?: number;
    kategorie?: string;
    originalName?: string;
    status?: string;
  };
}

// Portal-Notification (In-App)
export interface PortalNotification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  referenceType: string | null;
  referenceId: number | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  installationId: number;
}

// E-Mail Details für Popup
export interface PortalEmailDetail {
  id: number;
  subject: string | null;
  from: string;
  to: string;
  bodyHtml: string | null;
  bodyText: string | null;
  direction: "INBOUND" | "OUTBOUND";
  receivedAt: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export type DocumentStatus = "UPLOADED" | "VERIFIED" | "REJECTED" | "ARCHIVED";

export interface PortalDocument {
  id: number;
  kategorie: string;
  dokumentTyp: string | null;
  originalName: string;
  dateityp: string | null;
  dateigroesse: number | null;
  url: string;
  status: DocumentStatus;
  createdAt: string;
}

export interface DocumentCompletenessItem {
  kategorie: string;
  label: string;
  present: boolean;
  count: number;
}

export interface DocumentCompleteness {
  required: DocumentCompletenessItem[];
  fulfilled: number;
  total: number;
}

export interface PortalDocumentsResponse {
  data: PortalDocument[];
  completeness: DocumentCompleteness;
}

export interface PortalMessage {
  id: number;
  content: string;
  messageType: string;
  direction: string;
  senderType: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  read: boolean;
}

export interface OnboardingStatus {
  installationId: number;
  publicId: string;
  customerName: string | null;
  address: string;
  anlagenTyp: string | null;
  installateurName: string;
  onboardingCompleted: boolean;
  emailConsent: boolean;
  whatsappConsent: boolean;
  whatsappVerified: boolean;
  firstLoginAt: string | null;
}

export interface WhatsAppStatus {
  consent: boolean;
  number: string | null;
  verified: boolean;
  businessNumber: string;
  activationMessage: string;
}

// Alert-Typen für Kunden-Portal
export interface PortalAlert {
  id: number;
  type: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  message: string | null;
  deadline: string | null;
  createdAt: string;
  metadata: {
    customerNotifiedAt?: string;
    customerNotifiedVia?: string[];
    [key: string]: unknown;
  } | null;
  installation: {
    id: number;
    publicId: string;
    strasse: string | null;
    hausNr: string | null;
    ort: string | null;
  };
}

// API Functions

/**
 * Holt alle Installationen des Portal-Users.
 */
export async function getPortalInstallations(): Promise<PortalInstallation[]> {
  const response = await apiGet<{ success: boolean; data: PortalInstallation[] }>(
    "/api/portal/installations"
  );
  return response.data;
}

/**
 * Holt Details einer Installation.
 */
export async function getPortalInstallation(id: number): Promise<PortalInstallationDetail> {
  const response = await apiGet<{ success: boolean; data: PortalInstallationDetail }>(
    `/api/portal/installation/${id}`
  );
  return response.data;
}

/**
 * Holt die Timeline einer Installation (Status, E-Mails, Nachrichten, Dokumente kombiniert).
 */
export async function getPortalTimeline(id: number, type?: string): Promise<TimelineEntry[]> {
  const params = type && type !== "all" ? `?type=${type}` : "";
  const response = await apiGet<{ success: boolean; data: TimelineEntry[] }>(
    `/api/portal/installation/${id}/timeline${params}`
  );
  return response.data;
}

/**
 * Holt die Dokumente einer Installation inkl. Completeness-Info.
 */
export async function getPortalDocuments(id: number): Promise<PortalDocumentsResponse> {
  const response = await apiGet<{ success: boolean; data: PortalDocument[]; completeness: DocumentCompleteness }>(
    `/api/portal/installation/${id}/documents`
  );
  return { data: response.data, completeness: response.completeness };
}

/**
 * Holt die Details einer E-Mail.
 */
export async function getPortalEmailDetail(installationId: number, emailId: number): Promise<PortalEmailDetail> {
  const response = await apiGet<{ success: boolean; data: PortalEmailDetail }>(
    `/api/portal/installation/${installationId}/email/${emailId}`
  );
  return response.data;
}

/**
 * Holt die Nachrichten einer Installation.
 */
export async function getPortalMessages(id: number): Promise<PortalMessage[]> {
  const response = await apiGet<{ success: boolean; data: PortalMessage[] }>(
    `/api/portal/installation/${id}/messages`
  );
  return response.data;
}

/**
 * Sendet eine Nachricht zu einer Installation.
 */
export async function sendPortalMessage(id: number, content: string): Promise<PortalMessage> {
  const response = await apiPost<{ success: boolean; data: PortalMessage }>(
    `/api/portal/installation/${id}/messages`,
    { content }
  );
  return response.data;
}

/**
 * Markiert die NB-Portal-Freigabe als erledigt (Endkunden-Selbstauskunft).
 */
export async function markKundenfreigabeDone(installationId: number): Promise<void> {
  await apiPost<{ success: boolean }>(
    `/api/portal/installation/${installationId}/kundenfreigabe/done`,
    {}
  );
}

/**
 * Holt alle Alerts für den Portal-User.
 */
export async function getPortalAlerts(): Promise<PortalAlert[]> {
  const response = await apiGet<{ success: boolean; data: PortalAlert[] }>(
    "/api/portal/alerts"
  );
  return response.data;
}

/**
 * Holt Alerts für eine bestimmte Installation.
 */
export async function getPortalInstallationAlerts(id: number): Promise<PortalAlert[]> {
  const response = await apiGet<{ success: boolean; data: PortalAlert[] }>(
    `/api/portal/installation/${id}/alerts`
  );
  return response.data;
}

/**
 * Holt den Onboarding-Status.
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await apiGet<{ success: boolean; data: OnboardingStatus }>(
    "/api/portal/onboarding/status"
  );
  return response.data;
}

/**
 * Speichert die Consent-Einstellungen.
 */
export async function saveOnboardingConsent(data: {
  installationId: number;
  emailConsent: boolean;
  whatsappConsent?: boolean;
  whatsappNumber?: string;
}): Promise<void> {
  await apiPost("/api/portal/onboarding/consent", data);
}

/**
 * Schließt das Onboarding ab.
 */
export async function completeOnboarding(installationId: number): Promise<void> {
  await apiPost("/api/portal/onboarding/complete", { installationId });
}

/**
 * Holt den WhatsApp-Status.
 */
export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await apiGet<{ success: boolean; data: WhatsAppStatus }>(
    "/api/portal/whatsapp/status"
  );
  return response.data;
}

/**
 * Aktiviert WhatsApp-Benachrichtigungen.
 */
export async function requestWhatsApp(installationId: number, phoneNumber: string): Promise<void> {
  await apiPost("/api/portal/whatsapp/request", { installationId, phoneNumber });
}

// Admin API Functions (für Installateur)

export interface PortalStatus {
  isActivated: boolean;
  activatedAt: string | null;
  contactEmail: string | null;
  customerName: string | null;
  user: {
    id: number;
    email: string;
    name: string | null;
    lastLogin: string | null;
    createdAt: string;
  } | null;
  consent: {
    emailConsent: boolean;
    whatsappConsent: boolean;
    whatsappVerified: boolean;
    onboardingCompleted: boolean;
    firstLoginAt: string | null;
    lastPortalVisit: string | null;
  } | null;
}

/**
 * Holt den Portal-Status einer Installation (Admin).
 */
export async function getAdminPortalStatus(installationId: number): Promise<PortalStatus> {
  const response = await apiGet<{ success: boolean; data: PortalStatus }>(
    `/api/portal/admin/installations/${installationId}/status`
  );
  return response.data;
}

/**
 * Aktiviert das Portal für eine Installation (Admin).
 */
export async function activatePortal(installationId: number): Promise<{
  userId: number;
  email: string;
  isNewUser: boolean;
}> {
  const response = await apiPost<{
    success: boolean;
    data: { userId: number; email: string; isNewUser: boolean };
  }>(`/api/portal/admin/installations/${installationId}/activate`, {});
  return response.data;
}

/**
 * Sendet die Willkommens-E-Mail erneut (Admin).
 */
export async function resendWelcomeEmail(installationId: number): Promise<void> {
  await apiPost(`/api/portal/admin/installations/${installationId}/resend-welcome`, {});
}

// === Settings API ===

export interface PortalSettings {
  email: string;
  name: string | null;
  whatsappNumber: string | null;
  whatsappVerified: boolean;
  whatsappConsent: boolean;
}

/**
 * Holt die Portal-Einstellungen des Users.
 */
export async function getPortalSettings(): Promise<PortalSettings> {
  const response = await apiGet<{ success: boolean; data: PortalSettings }>(
    "/api/portal/settings"
  );
  return response.data;
}

/**
 * Ändert das Passwort des Portal-Users.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPost("/api/portal/settings/password", { currentPassword, newPassword });
}

/**
 * Entfernt die WhatsApp-Verknüpfung.
 */
export async function removeWhatsApp(): Promise<void> {
  await apiPost("/api/portal/settings/whatsapp/remove", {});
}

/**
 * Sendet eine Dokument-Anforderung an den Endkunden (Admin).
 * Nutzt WhatsApp + E-Mail je nach Consent.
 */
export async function sendDokumentAnforderung(
  installationId: number,
  dokumente: string[],
  customMessage?: string
): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const response = await apiPost<{
    success: boolean;
    data: { emailSent: boolean; whatsappSent: boolean };
  }>(`/api/portal/admin/${installationId}/dokument-anforderung`, {
    dokumente,
    ...(customMessage ? { customMessage } : {}),
  });
  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-APP NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Holt Portal-Notifications. Optional nur ungelesene.
 */
export async function getPortalNotifications(unreadOnly?: boolean): Promise<PortalNotification[]> {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  const response = await apiGet<{ success: boolean; data: PortalNotification[] }>(
    `/api/portal/notifications${params}`
  );
  return response.data;
}

/**
 * Holt die Anzahl ungelesener Notifications (für Badge).
 */
export async function getPortalNotificationCount(): Promise<{ unreadCount: number }> {
  const response = await apiGet<{ success: boolean; data: { unreadCount: number } }>(
    "/api/portal/notifications/count"
  );
  return response.data;
}

/**
 * Markiert Notifications als gelesen.
 */
export async function markNotificationsRead(ids: number[] | "all"): Promise<void> {
  const body = ids === "all" ? { all: true } : { ids };
  await apiPost("/api/portal/notifications/read", body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECHNUNGEN / INVOICES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PortalInvoice {
  id: number;
  rechnungsNummer: string;
  status: string;
  rechnungsDatum: string | null;
  faelligAm: string | null;
  betragNetto: number;
  betragMwst: number;
  betragBrutto: number;
  beschreibung: string | null;
  pdfPath: string | null;
  bezahltAm: string | null;
  paymentLink: {
    token: string;
    id: number;
    wisePaymentUrl: string | null;
  } | null;
  letzteMahnung: {
    stufe: number;
    erstelltAm: string;
  } | null;
}

export interface PortalInvoiceSummary {
  total: number;
  offen: number;
  offenerBetrag: number;
  bezahlt: number;
}

/**
 * Holt alle Rechnungen des Portal-Users.
 */
export async function getPortalInvoices(status?: string): Promise<{
  data: PortalInvoice[];
  summary: PortalInvoiceSummary;
}> {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiGet<{
    success: boolean;
    data: PortalInvoice[];
    summary: PortalInvoiceSummary;
  }>(`/api/portal/rechnungen${params}`);
  return { data: response.data, summary: response.summary };
}

/**
 * Holt oder erstellt einen PaymentLink für eine Rechnung.
 */
export async function getPortalPaymentLink(rechnungId: number): Promise<{
  token: string;
  url: string;
  id: number;
}> {
  const response = await apiPost<{
    success: boolean;
    data: { token: string; url: string; id: number };
  }>(`/api/portal/rechnungen/${rechnungId}/payment-link`, {});
  return response.data;
}
