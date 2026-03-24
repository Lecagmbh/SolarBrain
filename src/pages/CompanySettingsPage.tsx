import React, { useEffect, useState, useRef, useCallback } from "react";
import { apiGet, api } from "../modules/api/client";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type CompanySettings = {
  companyName: string; legalName: string; tagline: string; taxId: string; vatId: string;
  registrationNumber: string; foundedYear: number; employeeCount: string; industry: string;
  email: string; phone: string; fax: string; website: string; supportEmail: string; supportPhone: string;
  street: string; houseNumber: string; addressExtra: string; zip: string; city: string; state: string; country: string;
  bankName: string; iban: string; bic: string; accountHolder: string; paypalEmail: string;
  logo: string | null; favicon: string | null; primaryColor: string; secondaryColor: string; accentColor: string;
  emailProvider: string; emailHost: string; emailPort: number; emailUser: string; emailPassword: string;
  emailEncryption: string; emailFrom: string; emailFromName: string; emailReplyTo: string;
  emailSignature: string; emailFooter: string; emailTestAddress: string;
  invoicePrefix: string; invoiceNextNumber: number; offerPrefix: string; offerNextNumber: number;
  defaultPaymentDays: number; defaultVatRate: number; invoiceNotes: string;
  showBankOnInvoice: boolean; showLogoOnInvoice: boolean;
  googleDriveConnected: boolean; slackConnected: boolean; microsoftConnected: boolean; zapierConnected: boolean;
  webhookUrl: string; webhookSecret: string; apiKey: string; apiKeyCreated: string | null;
  notifyNewCustomer: boolean; notifyNewInstallation: boolean; notifyDocumentUpload: boolean;
  notifyStatusChange: boolean; notifyPaymentReceived: boolean; notifyWeeklyReport: boolean; notifyEmail: string;
  twoFactorRequired: boolean; twoFactorMethod: string; sessionTimeout: number; maxLoginAttempts: number;
  ipWhitelist: string; passwordPolicy: string; passwordMinLength: number; auditLogEnabled: boolean;
  language: string; timezone: string; dateFormat: string; currency: string;
  featureWizard: boolean; featureAI: boolean; featureAnalytics: boolean; featureAPI: boolean;
};

const INITIAL: CompanySettings = {
  companyName: "", legalName: "", tagline: "", taxId: "", vatId: "", registrationNumber: "",
  foundedYear: 2024, employeeCount: "1-10", industry: "solar",
  email: "", phone: "", fax: "", website: "", supportEmail: "", supportPhone: "",
  street: "", houseNumber: "", addressExtra: "", zip: "", city: "", state: "", country: "Deutschland",
  bankName: "", iban: "", bic: "", accountHolder: "", paypalEmail: "",
  logo: null, favicon: null, primaryColor: "#D4A843", secondaryColor: "#EAD068", accentColor: "#22c55e",
  emailProvider: "smtp", emailHost: "", emailPort: 587, emailUser: "", emailPassword: "",
  emailEncryption: "tls", emailFrom: "", emailFromName: "", emailReplyTo: "", emailSignature: "", emailFooter: "", emailTestAddress: "",
  invoicePrefix: "RE-", invoiceNextNumber: 1001, offerPrefix: "AN-", offerNextNumber: 1001,
  defaultPaymentDays: 14, defaultVatRate: 19, invoiceNotes: "", showBankOnInvoice: true, showLogoOnInvoice: true,
  googleDriveConnected: false, slackConnected: false, microsoftConnected: false, zapierConnected: false,
  webhookUrl: "", webhookSecret: "", apiKey: "", apiKeyCreated: null,
  notifyNewCustomer: true, notifyNewInstallation: true, notifyDocumentUpload: true, notifyStatusChange: true,
  notifyPaymentReceived: true, notifyWeeklyReport: false, notifyEmail: "",
  twoFactorRequired: false, twoFactorMethod: "app", sessionTimeout: 480, maxLoginAttempts: 5,
  ipWhitelist: "", passwordPolicy: "strong", passwordMinLength: 8, auditLogEnabled: true,
  language: "de-DE", timezone: "Europe/Berlin", dateFormat: "DD.MM.YYYY", currency: "EUR",
  featureWizard: true, featureAI: true, featureAnalytics: true, featureAPI: true,
};

const TABS = [
  { id: "general", label: "Unternehmen", icon: "🏢" },
  { id: "contact", label: "Kontakt", icon: "📞" },
  { id: "address", label: "Adresse", icon: "📍" },
  { id: "bank", label: "Bank", icon: "🏦" },
  { id: "branding", label: "Branding", icon: "🎨" },
  { id: "email", label: "E-Mail", icon: "📧" },
  { id: "invoices", label: "Rechnungen", icon: "📄" },
  { id: "integrations", label: "Integrationen", icon: "🔌" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "notifications", label: "Benachrichtigungen", icon: "🔔" },
  { id: "security", label: "Sicherheit", icon: "🛡️" },
  { id: "localization", label: "Sprache", icon: "🌍" },
  { id: "features", label: "Features", icon: "⚡" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const styles = `
.cs-page { min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0d0d14 50%, #0a0f1a 100%); padding: 32px; position: relative; }
.cs-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.3; pointer-events: none; z-index: 0; }
.cs-orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #D4A843 0%, transparent 70%); left: -150px; top: 10%; }
.cs-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #EAD068 0%, transparent 70%); right: -100px; bottom: 20%; }
.cs-header { position: relative; z-index: 10; margin-bottom: 32px; display: flex; align-items: center; gap: 16px; }
.cs-header-icon { width: 56px; height: 56px; background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 8px 32px rgba(212, 168, 67, 0.3); }
.cs-header h1 { font-size: 28px; font-weight: 800; color: white; margin: 0 0 4px 0; }
.cs-header p { color: rgba(255,255,255,0.5); font-size: 14px; margin: 0; }
.cs-layout { display: flex; gap: 32px; position: relative; z-index: 10; }
.cs-sidebar { width: 220px; flex-shrink: 0; }
.cs-nav { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 8px; position: sticky; top: 32px; }
.cs-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: transparent; width: 100%; text-align: left; }
.cs-nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
.cs-nav-item.active { background: linear-gradient(135deg, rgba(212,168,67,0.15), rgba(139,92,246,0.1)); color: #a5b4fc; }
.cs-content { flex: 1; min-width: 0; }
.cs-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 28px; margin-bottom: 24px; }
.cs-card-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.cs-card-icon { width: 44px; height: 44px; background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(139,92,246,0.15)); border: 1px solid rgba(212,168,67,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.cs-card-title { font-size: 18px; font-weight: 700; color: white; margin: 0 0 4px 0; }
.cs-card-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
.cs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.cs-grid-3 { grid-template-columns: repeat(3, 1fr); }
.cs-grid-1 { grid-template-columns: 1fr; }
.cs-field { display: flex; flex-direction: column; gap: 8px; }
.cs-field.full { grid-column: 1 / -1; }
.cs-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); }
.cs-input { padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: white; font-size: 14px; transition: all 0.2s; outline: none; width: 100%; }
.cs-input::placeholder { color: rgba(255,255,255,0.3); }
.cs-input:focus { border-color: rgba(212,168,67,0.5); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 3px rgba(212,168,67,0.1); }
.cs-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff60' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px; cursor: pointer; }
.cs-select option { background: #1a1a2e; color: white; }
.cs-textarea { min-height: 100px; resize: vertical; font-family: inherit; }
.cs-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.cs-toggle-row:last-child { border-bottom: none; }
.cs-toggle-info h4 { font-size: 14px; font-weight: 600; color: white; margin: 0 0 4px 0; }
.cs-toggle-info p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
.cs-toggle { position: relative; width: 48px; height: 26px; background: rgba(255,255,255,0.1); border-radius: 100px; cursor: pointer; transition: all 0.3s; border: none; }
.cs-toggle.active { background: linear-gradient(135deg, #D4A843, #EAD068); }
.cs-toggle::after { content: ''; position: absolute; width: 20px; height: 20px; background: white; border-radius: 50%; top: 3px; left: 3px; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.cs-toggle.active::after { left: 25px; }
.cs-color-row { display: flex; align-items: center; gap: 12px; }
.cs-color-preview { width: 44px; height: 44px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; }
.cs-color-input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.cs-upload-area { border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; }
.cs-upload-area:hover { border-color: rgba(212,168,67,0.4); background: rgba(212,168,67,0.05); }
.cs-upload-icon { font-size: 32px; margin-bottom: 12px; }
.cs-upload-text { color: rgba(255,255,255,0.7); font-size: 14px; margin: 0 0 4px 0; }
.cs-upload-hint { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
.cs-upload-preview { position: relative; display: inline-block; }
.cs-upload-preview img { max-width: 200px; max-height: 80px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
.cs-upload-remove { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; background: #ef4444; border: none; border-radius: 50%; color: white; cursor: pointer; font-size: 14px; }
.cs-integration-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.cs-int-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
.cs-int-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.cs-int-info { flex: 1; }
.cs-int-name { font-size: 15px; font-weight: 600; color: white; margin: 0 0 4px 0; }
.cs-int-status { font-size: 12px; color: rgba(255,255,255,0.5); }
.cs-int-status.on { color: #22c55e; }
.cs-int-btn { padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 13px; cursor: pointer; }
.cs-int-btn.on { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: #22c55e; }
.cs-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
.cs-btn-primary { background: linear-gradient(135deg, #D4A843, #EAD068); color: white; box-shadow: 0 4px 20px rgba(212,168,67,0.3); }
.cs-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(212,168,67,0.4); }
.cs-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.cs-btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; }
.cs-footer { position: sticky; bottom: 0; padding: 20px 0; background: linear-gradient(to top, #0a0a0f 0%, transparent 100%); display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
.cs-toast { position: fixed; bottom: 32px; right: 32px; padding: 16px 24px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; color: #22c55e; font-size: 14px; font-weight: 500; z-index: 100; }
.cs-toast.error { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #f87171; }
@media (max-width: 1024px) { .cs-layout { flex-direction: column; } .cs-sidebar { width: 100%; } .cs-nav { display: flex; flex-wrap: wrap; gap: 8px; position: static; } .cs-nav-item { flex: 0 0 auto; } .cs-grid, .cs-grid-3 { grid-template-columns: 1fr; } .cs-integration-grid { grid-template-columns: 1fr; } }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(INITIAL);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPw] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!document.getElementById("cs-styles")) {
      const s = document.createElement("style");
      s.id = "cs-styles";
      s.textContent = styles;
      document.head.appendChild(s);
    }
    load();
  }, []);

  const load = async () => {
    try {
      const r = await apiGet("/settings/company");
      if (r?.data) setSettings(prev => ({ ...prev, ...r.data }));
    } catch (e) { console.error(e); showToast("Laden fehlgeschlagen", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const update = useCallback(<K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => {
    setSettings(prev => ({ ...prev, [k]: v }));
    setHasChanges(true);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings/company", settings);
      showToast("Gespeichert ✓", "success");
      setHasChanges(false);
    } catch { showToast("Speichern fehlgeschlagen", "error"); }
    finally { setSaving(false); }
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => update("logo", r.result as string);
    r.readAsDataURL(f);
  };

  const handleFavicon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => update("favicon", r.result as string);
    r.readAsDataURL(f);
  };

  const testEmail = async () => {
    try {
      await api.post("/settings/test-email", { to: settings.emailTestAddress || settings.email });
      showToast("Test-E-Mail gesendet", "success");
    } catch { showToast("Test fehlgeschlagen", "error"); }
  };

  const genApiKey = async () => {
    try {
      const r = await api.post("/settings/generate-api-key");
      update("apiKey", r.data.apiKey);
      update("apiKeyCreated", new Date().toISOString());
      showToast("API-Key generiert", "success");
    } catch { showToast("Fehler beim Generieren", "error"); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); showToast("Kopiert", "success"); };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderGeneral = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">🏢</div>
        <div><h3 className="cs-card-title">Unternehmensdaten</h3><p className="cs-card-desc">Grundlegende Informationen</p></div>
      </div>
      <div className="cs-grid">
        <Field label="Firmenname" value={settings.companyName} onChange={v => update("companyName", v)} placeholder="Baunity GmbH" />
        <Field label="Rechtlicher Name" value={settings.legalName} onChange={v => update("legalName", v)} placeholder="Baunity Solutions GmbH" />
        <Field label="Slogan" value={settings.tagline} onChange={v => update("tagline", v)} placeholder="Ihre Experten für Netzanmeldungen" full />
        <Field label="Steuernummer" value={settings.taxId} onChange={v => update("taxId", v)} placeholder="123/456/78901" />
        <Field label="USt-IdNr." value={settings.vatId} onChange={v => update("vatId", v)} placeholder="DE123456789" />
        <Field label="Handelsregister" value={settings.registrationNumber} onChange={v => update("registrationNumber", v)} placeholder="HRB 12345" />
        <Field label="Gründungsjahr" value={settings.foundedYear} onChange={v => update("foundedYear", +v)} type="number" />
        <Select label="Mitarbeiter" value={settings.employeeCount} onChange={v => update("employeeCount", v)} options={[["1-10","1-10"],["11-50","11-50"],["51-200","51-200"],["200+","200+"]]} />
        <Select label="Branche" value={settings.industry} onChange={v => update("industry", v)} options={[["solar","Solar/PV"],["electrical","Elektro"],["energy","Energie"],["other","Sonstige"]]} />
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">📞</div>
        <div><h3 className="cs-card-title">Kontaktdaten</h3><p className="cs-card-desc">Erreichbarkeit</p></div>
      </div>
      <div className="cs-grid">
        <Field label="E-Mail" value={settings.email} onChange={v => update("email", v)} type="email" placeholder="info@firma.de" />
        <Field label="Support E-Mail" value={settings.supportEmail} onChange={v => update("supportEmail", v)} type="email" placeholder="support@firma.de" />
        <Field label="Telefon" value={settings.phone} onChange={v => update("phone", v)} placeholder="+49 123 456789" />
        <Field label="Support Telefon" value={settings.supportPhone} onChange={v => update("supportPhone", v)} placeholder="+49 123 456789-1" />
        <Field label="Fax" value={settings.fax} onChange={v => update("fax", v)} placeholder="+49 123 456789-9" />
        <Field label="Website" value={settings.website} onChange={v => update("website", v)} type="url" placeholder="https://www.firma.de" />
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">📍</div>
        <div><h3 className="cs-card-title">Adresse</h3><p className="cs-card-desc">Firmensitz</p></div>
      </div>
      <div className="cs-grid">
        <Field label="Straße" value={settings.street} onChange={v => update("street", v)} placeholder="Musterstraße" />
        <Field label="Hausnr." value={settings.houseNumber} onChange={v => update("houseNumber", v)} placeholder="123" />
        <Field label="Adresszusatz" value={settings.addressExtra} onChange={v => update("addressExtra", v)} placeholder="Gebäude B" full />
        <Field label="PLZ" value={settings.zip} onChange={v => update("zip", v)} placeholder="12345" />
        <Field label="Stadt" value={settings.city} onChange={v => update("city", v)} placeholder="Musterstadt" />
        <Select label="Bundesland" value={settings.state} onChange={v => update("state", v)} options={[["","Bitte wählen"],["BW","Baden-Württemberg"],["BY","Bayern"],["BE","Berlin"],["BB","Brandenburg"],["HB","Bremen"],["HH","Hamburg"],["HE","Hessen"],["MV","Meckl.-Vorpommern"],["NI","Niedersachsen"],["NW","NRW"],["RP","Rheinland-Pfalz"],["SL","Saarland"],["SN","Sachsen"],["ST","Sachsen-Anhalt"],["SH","Schleswig-Holstein"],["TH","Thüringen"]]} />
        <Select label="Land" value={settings.country} onChange={v => update("country", v)} options={[["Deutschland","Deutschland"],["Österreich","Österreich"],["Schweiz","Schweiz"]]} />
      </div>
    </div>
  );

  const renderBank = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">🏦</div>
        <div><h3 className="cs-card-title">Bankverbindung</h3><p className="cs-card-desc">Kontodaten für Rechnungen</p></div>
      </div>
      <div className="cs-grid">
        <Field label="Kontoinhaber" value={settings.accountHolder} onChange={v => update("accountHolder", v)} placeholder="Baunity GmbH" />
        <Field label="Bank" value={settings.bankName} onChange={v => update("bankName", v)} placeholder="Sparkasse" />
        <Field label="IBAN" value={settings.iban} onChange={v => update("iban", v)} placeholder="DE89 3704 0044 0532 0130 00" />
        <Field label="BIC" value={settings.bic} onChange={v => update("bic", v)} placeholder="COBADEFFXXX" />
        <Field label="PayPal E-Mail" value={settings.paypalEmail} onChange={v => update("paypalEmail", v)} type="email" placeholder="paypal@firma.de" full />
      </div>
    </div>
  );

  const renderBranding = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">🎨</div>
        <div><h3 className="cs-card-title">Branding</h3><p className="cs-card-desc">Logo und Farben</p></div>
      </div>
      <div className="cs-grid">
        <div className="cs-field">
          <label className="cs-label">Logo</label>
          <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
          {settings.logo ? (
            <div className="cs-upload-preview">
              <img src={settings.logo} alt="Logo" />
              <button className="cs-upload-remove" onClick={() => update("logo", null)}>×</button>
            </div>
          ) : (
            <div className="cs-upload-area" onClick={() => logoRef.current?.click()}>
              <div className="cs-upload-icon">📤</div>
              <p className="cs-upload-text">Logo hochladen</p>
              <p className="cs-upload-hint">PNG, SVG oder JPG</p>
            </div>
          )}
        </div>
        <div className="cs-field">
          <label className="cs-label">Favicon</label>
          <input ref={faviconRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFavicon} />
          {settings.favicon ? (
            <div className="cs-upload-preview">
              <img src={settings.favicon} alt="Favicon" style={{ maxWidth: 64 }} />
              <button className="cs-upload-remove" onClick={() => update("favicon", null)}>×</button>
            </div>
          ) : (
            <div className="cs-upload-area" onClick={() => faviconRef.current?.click()}>
              <div className="cs-upload-icon">📤</div>
              <p className="cs-upload-text">Favicon hochladen</p>
              <p className="cs-upload-hint">PNG oder ICO</p>
            </div>
          )}
        </div>
      </div>
      <div className="cs-grid" style={{ marginTop: 24 }}>
        <ColorPicker label="Primärfarbe" value={settings.primaryColor} onChange={v => update("primaryColor", v)} />
        <ColorPicker label="Sekundärfarbe" value={settings.secondaryColor} onChange={v => update("secondaryColor", v)} />
        <ColorPicker label="Akzentfarbe" value={settings.accentColor} onChange={v => update("accentColor", v)} />
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">📧</div>
        <div><h3 className="cs-card-title">E-Mail</h3><p className="cs-card-desc">SMTP-Einstellungen</p></div>
      </div>
      <div className="cs-grid">
        <Select label="Provider" value={settings.emailProvider} onChange={v => update("emailProvider", v)} options={[["smtp","SMTP"],["sendgrid","SendGrid"],["ses","Amazon SES"],["mailgun","Mailgun"]]} />
        <Field label="Host" value={settings.emailHost} onChange={v => update("emailHost", v)} placeholder="smtp.example.com" />
        <Field label="Port" value={settings.emailPort} onChange={v => update("emailPort", +v)} type="number" />
        <Select label="Verschlüsselung" value={settings.emailEncryption} onChange={v => update("emailEncryption", v)} options={[["tls","TLS"],["ssl","SSL"],["none","Keine"]]} />
        <Field label="Benutzer" value={settings.emailUser} onChange={v => update("emailUser", v)} />
        <Field label="Passwort" value={settings.emailPassword} onChange={v => update("emailPassword", v)} type={showPw ? "text" : "password"} />
        <Field label="Absender E-Mail" value={settings.emailFrom} onChange={v => update("emailFrom", v)} type="email" placeholder="noreply@firma.de" />
        <Field label="Absender Name" value={settings.emailFromName} onChange={v => update("emailFromName", v)} placeholder="Baunity" />
        <Field label="Reply-To" value={settings.emailReplyTo} onChange={v => update("emailReplyTo", v)} type="email" />
        <Field label="Test-Adresse" value={settings.emailTestAddress} onChange={v => update("emailTestAddress", v)} type="email" />
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="cs-btn cs-btn-secondary" onClick={testEmail}>📨 Test-E-Mail senden</button>
      </div>
      <div className="cs-grid cs-grid-1" style={{ marginTop: 20 }}>
        <div className="cs-field">
          <label className="cs-label">Signatur</label>
          <textarea className="cs-input cs-textarea" value={settings.emailSignature} onChange={e => update("emailSignature", e.target.value)} placeholder="Mit freundlichen Grüßen..." />
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">📄</div>
        <div><h3 className="cs-card-title">Rechnungen</h3><p className="cs-card-desc">Nummernkreise & Einstellungen</p></div>
      </div>
      <div className="cs-grid cs-grid-3">
        <Field label="Rechnungs-Präfix" value={settings.invoicePrefix} onChange={v => update("invoicePrefix", v)} />
        <Field label="Nächste Nr." value={settings.invoiceNextNumber} onChange={v => update("invoiceNextNumber", +v)} type="number" />
        <Field label="Vorschau" value={`${settings.invoicePrefix}${settings.invoiceNextNumber}`} onChange={() => {}} disabled />
        <Field label="Angebots-Präfix" value={settings.offerPrefix} onChange={v => update("offerPrefix", v)} />
        <Field label="Nächste Nr." value={settings.offerNextNumber} onChange={v => update("offerNextNumber", +v)} type="number" />
        <Field label="Vorschau" value={`${settings.offerPrefix}${settings.offerNextNumber}`} onChange={() => {}} disabled />
        <Field label="Zahlungsziel (Tage)" value={settings.defaultPaymentDays} onChange={v => update("defaultPaymentDays", +v)} type="number" />
        <Field label="MwSt. (%)" value={settings.defaultVatRate} onChange={v => update("defaultVatRate", +v)} type="number" />
      </div>
      <div style={{ marginTop: 24 }}>
        <Toggle label="Logo auf Rechnungen" desc="Firmenlogo anzeigen" value={settings.showLogoOnInvoice} onChange={v => update("showLogoOnInvoice", v)} />
        <Toggle label="Bankdaten auf Rechnungen" desc="Automatisch einfügen" value={settings.showBankOnInvoice} onChange={v => update("showBankOnInvoice", v)} />
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <>
      <div className="cs-card">
        <div className="cs-card-header">
          <div className="cs-card-icon">🔌</div>
          <div><h3 className="cs-card-title">Integrationen</h3><p className="cs-card-desc">Externe Dienste</p></div>
        </div>
        <div className="cs-integration-grid">
          <IntCard icon="📁" name="Google Drive" connected={settings.googleDriveConnected} />
          <IntCard icon="💬" name="Slack" connected={settings.slackConnected} />
          <IntCard icon="📧" name="Microsoft 365" connected={settings.microsoftConnected} />
          <IntCard icon="⚡" name="Zapier" connected={settings.zapierConnected} />
        </div>
      </div>
      <div className="cs-card">
        <div className="cs-card-header">
          <div className="cs-card-icon">🔑</div>
          <div><h3 className="cs-card-title">API-Zugang</h3><p className="cs-card-desc">Für externe Anwendungen</p></div>
        </div>
        {settings.apiKey ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 10, fontFamily: "monospace", fontSize: 13 }}>
            <code style={{ flex: 1, wordBreak: "break-all", color: "rgba(255,255,255,0.7)" }}>{showApiKey ? settings.apiKey : "••••••••••••••••••••"}</code>
            <button className="cs-btn cs-btn-secondary" style={{ padding: "8px 12px" }} onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? "🙈" : "👁️"}</button>
            <button className="cs-btn cs-btn-secondary" style={{ padding: "8px 12px" }} onClick={() => copy(settings.apiKey)}>📋</button>
          </div>
        ) : (
          <button className="cs-btn cs-btn-primary" onClick={genApiKey}>🔑 API-Key generieren</button>
        )}
      </div>
      <div className="cs-card">
        <div className="cs-card-header">
          <div className="cs-card-icon">🔗</div>
          <div><h3 className="cs-card-title">Webhooks</h3><p className="cs-card-desc">Event-Benachrichtigungen</p></div>
        </div>
        <div className="cs-grid">
          <Field label="Webhook URL" value={settings.webhookUrl} onChange={v => update("webhookUrl", v)} type="url" placeholder="https://api.example.com/webhook" />
          <Field label="Secret" value={settings.webhookSecret} onChange={v => update("webhookSecret", v)} placeholder="whsec_..." />
        </div>
      </div>
    </>
  );

  const renderWhatsApp = () => (
    <>
      <div className="cs-card">
        <div className="cs-card-header">
          <div className="cs-card-icon">💬</div>
          <div><h3 className="cs-card-title">WhatsApp Integration</h3><p className="cs-card-desc">Anlagen per WhatsApp erfassen</p></div>
        </div>
        <div style={{ padding: "20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 24 }}>📱</span>
            </div>
            <div>
              <div style={{ color: "#10b981", fontWeight: 600, fontSize: 14 }}>✓ WhatsApp Bot aktiv</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Nachrichten werden automatisch verarbeitet</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 8 }}>WhatsApp Nummer</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <code style={{ flex: 1, padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 8, color: "white", fontSize: 16, fontFamily: "monospace" }}>
                +49 155 67095659
              </code>
              <button
                className="cs-btn cs-btn-secondary"
                style={{ padding: "12px 16px" }}
                onClick={() => {
                  navigator.clipboard.writeText("+4915567095659");
                  showToast("Nummer kopiert!", "success");
                }}
              >
                📋 Kopieren
              </button>
            </div>
          </div>

          <div style={{ background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.2)", borderRadius: 12, padding: 20 }}>
            <h4 style={{ color: "#25D366", margin: "0 0 12px 0", fontSize: 14, fontWeight: 600 }}>So funktioniert's:</h4>
            <ol style={{ margin: 0, paddingLeft: 20, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.8 }}>
              <li>Kunde sendet Anlagendaten per WhatsApp an die Nummer oben</li>
              <li>Unser KI-Bot erfasst automatisch alle relevanten Informationen</li>
              <li>Bei fehlenden Daten fragt der Bot nach</li>
              <li>Nach Bestätigung wird die Anlage im System angelegt</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="cs-card">
        <div className="cs-card-header">
          <div className="cs-card-icon">📊</div>
          <div><h3 className="cs-card-title">WhatsApp Statistiken</h3><p className="cs-card-desc">Übersicht der Konversationen</p></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: "20px 0" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "white" }}>-</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Gespräche gesamt</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#10b981" }}>-</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Erfolgreich abgeschlossen</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b" }}>-</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Letzte 24h</div>
          </div>
        </div>
      </div>
    </>
  );

  const renderNotifications = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">🔔</div>
        <div><h3 className="cs-card-title">Benachrichtigungen</h3><p className="cs-card-desc">Wann möchten Sie informiert werden?</p></div>
      </div>
      <Toggle label="Neuer Kunde" desc="Bei Kundenregistrierung" value={settings.notifyNewCustomer} onChange={v => update("notifyNewCustomer", v)} />
      <Toggle label="Neue Netzanmeldung" desc="Bei Wizard-Einreichung" value={settings.notifyNewInstallation} onChange={v => update("notifyNewInstallation", v)} />
      <Toggle label="Dokument hochgeladen" desc="Wenn Kunde Datei hochlädt" value={settings.notifyDocumentUpload} onChange={v => update("notifyDocumentUpload", v)} />
      <Toggle label="Status-Änderung" desc="Bei Änderung des Anmeldungsstatus" value={settings.notifyStatusChange} onChange={v => update("notifyStatusChange", v)} />
      <Toggle label="Zahlung eingegangen" desc="Bei eingehenden Zahlungen" value={settings.notifyPaymentReceived} onChange={v => update("notifyPaymentReceived", v)} />
      <Toggle label="Wöchentlicher Report" desc="Zusammenfassung per E-Mail" value={settings.notifyWeeklyReport} onChange={v => update("notifyWeeklyReport", v)} />
      <div className="cs-grid" style={{ marginTop: 20 }}>
        <Field label="Benachrichtigungs-E-Mail" value={settings.notifyEmail} onChange={v => update("notifyEmail", v)} type="email" placeholder="alerts@firma.de" full />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">🛡️</div>
        <div><h3 className="cs-card-title">Sicherheit</h3><p className="cs-card-desc">Schutz für Konten und Daten</p></div>
      </div>
      <Toggle label="Zwei-Faktor-Authentifizierung" desc="Für alle Benutzer erforderlich" value={settings.twoFactorRequired} onChange={v => update("twoFactorRequired", v)} />
      <Toggle label="Audit-Log" desc="Alle Aktionen protokollieren" value={settings.auditLogEnabled} onChange={v => update("auditLogEnabled", v)} />
      <div className="cs-grid" style={{ marginTop: 20 }}>
        <Select label="2FA Methode" value={settings.twoFactorMethod} onChange={v => update("twoFactorMethod", v)} options={[["app","Authenticator App"],["sms","SMS"],["email","E-Mail"]]} />
        <Field label="Session-Timeout (Min.)" value={settings.sessionTimeout} onChange={v => update("sessionTimeout", +v)} type="number" />
        <Field label="Max. Login-Versuche" value={settings.maxLoginAttempts} onChange={v => update("maxLoginAttempts", +v)} type="number" />
        <Select label="Passwort-Richtlinie" value={settings.passwordPolicy} onChange={v => update("passwordPolicy", v)} options={[["standard","Standard"],["strong","Stark"],["custom","Benutzerdefiniert"]]} />
        <Field label="Min. Passwortlänge" value={settings.passwordMinLength} onChange={v => update("passwordMinLength", +v)} type="number" />
        <Field label="IP-Whitelist" value={settings.ipWhitelist} onChange={v => update("ipWhitelist", v)} placeholder="192.168.1.0/24" />
      </div>
    </div>
  );

  const renderLocalization = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">🌍</div>
        <div><h3 className="cs-card-title">Lokalisierung</h3><p className="cs-card-desc">Sprache und Formate</p></div>
      </div>
      <div className="cs-grid">
        <Select label="Sprache" value={settings.language} onChange={v => update("language", v)} options={[["de-DE","Deutsch"],["en-US","English"],["fr-FR","Français"]]} />
        <Select label="Zeitzone" value={settings.timezone} onChange={v => update("timezone", v)} options={[["Europe/Berlin","Berlin"],["Europe/Vienna","Wien"],["Europe/Zurich","Zürich"]]} />
        <Select label="Datumsformat" value={settings.dateFormat} onChange={v => update("dateFormat", v)} options={[["DD.MM.YYYY","DD.MM.YYYY"],["YYYY-MM-DD","YYYY-MM-DD"],["MM/DD/YYYY","MM/DD/YYYY"]]} />
        <Select label="Währung" value={settings.currency} onChange={v => update("currency", v)} options={[["EUR","Euro (€)"],["CHF","Franken (CHF)"],["USD","Dollar ($)"]]} />
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="cs-card">
      <div className="cs-card-header">
        <div className="cs-card-icon">⚡</div>
        <div><h3 className="cs-card-title">Features</h3><p className="cs-card-desc">Funktionen aktivieren/deaktivieren</p></div>
      </div>
      <Toggle label="Anlagen-Wizard" desc="Netzanmeldungs-Assistent" value={settings.featureWizard} onChange={v => update("featureWizard", v)} />
      <Toggle label="AI-Assistent" desc="KI-gestützte Hilfe" value={settings.featureAI} onChange={v => update("featureAI", v)} />
      <Toggle label="Analytics" desc="Statistiken und Berichte" value={settings.featureAnalytics} onChange={v => update("featureAnalytics", v)} />
      <Toggle label="API-Zugang" desc="Externe Schnittstelle" value={settings.featureAPI} onChange={v => update("featureAPI", v)} />
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "general": return renderGeneral();
      case "contact": return renderContact();
      case "address": return renderAddress();
      case "bank": return renderBank();
      case "branding": return renderBranding();
      case "email": return renderEmail();
      case "invoices": return renderInvoices();
      case "integrations": return renderIntegrations();
      case "whatsapp": return renderWhatsApp();
      case "notifications": return renderNotifications();
      case "security": return renderSecurity();
      case "localization": return renderLocalization();
      case "features": return renderFeatures();
      default: return null;
    }
  };

  if (loading) return <div className="cs-page"><p style={{ color: "white" }}>Laden...</p></div>;

  return (
    <div className="cs-page">
      <div className="cs-orb cs-orb-1" />
      <div className="cs-orb cs-orb-2" />

      <div className="cs-header">
        <div className="cs-header-icon">⚙️</div>
        <div>
          <h1>Firmeneinstellungen</h1>
          <p>Verwalten Sie Ihre Unternehmensdaten und Konfiguration</p>
        </div>
      </div>

      <div className="cs-layout">
        <aside className="cs-sidebar">
          <nav className="cs-nav">
            {TABS.map(t => (
              <button key={t.id} className={`cs-nav-item ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="cs-content">
          {renderTab()}
          
          <div className="cs-footer">
            <button className="cs-btn cs-btn-secondary" onClick={load}>↻ Zurücksetzen</button>
            <button className="cs-btn cs-btn-primary" onClick={save} disabled={saving || !hasChanges}>
              {saving ? "Speichern..." : "💾 Speichern"}
            </button>
          </div>
        </main>
      </div>

      {toast && <div className={`cs-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function Field({ label, value, onChange, type = "text", placeholder = "", full = false, disabled = false }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; full?: boolean; disabled?: boolean;
}) {
  return (
    <div className={`cs-field ${full ? "full" : ""}`}>
      <label className="cs-label">{label}</label>
      <input
        type={type}
        className="cs-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={disabled ? { opacity: 0.5 } : undefined}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div className="cs-field">
      <label className="cs-label">{label}</label>
      <select className="cs-input cs-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="cs-toggle-row">
      <div className="cs-toggle-info">
        <h4>{label}</h4>
        <p>{desc}</p>
      </div>
      <button className={`cs-toggle ${value ? "active" : ""}`} onClick={() => onChange(!value)} />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const id = `color-${label.replace(/\s/g, "")}`;
  return (
    <div className="cs-field">
      <label className="cs-label">{label}</label>
      <div className="cs-color-row">
        <input type="color" id={id} className="cs-color-input" value={value} onChange={e => onChange(e.target.value)} />
        <label htmlFor={id} className="cs-color-preview" style={{ backgroundColor: value }} />
        <input type="text" className="cs-input" value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

function IntCard({ icon, name, connected }: { icon: string; name: string; connected: boolean }) {
  return (
    <div className="cs-int-card">
      <div className="cs-int-icon">{icon}</div>
      <div className="cs-int-info">
        <h4 className="cs-int-name">{name}</h4>
        <p className={`cs-int-status ${connected ? "on" : ""}`}>{connected ? "Verbunden" : "Nicht verbunden"}</p>
      </div>
      <button className={`cs-int-btn ${connected ? "on" : ""}`}>{connected ? "Trennen" : "Verbinden"}</button>
    </div>
  );
}
