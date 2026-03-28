/**
 * Baunity Wizard UI Components - Mit eingebettetem CSS
 * Basierend auf LECA Design, Akzentfarbe: #638bff (Blau)
 */

import React, { useEffect } from 'react';

// KRITISCH: Helper um Object-Rendering-Fehler zu vermeiden (React Error #525)
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    if ('label' in (value as object)) return String((value as { label: unknown }).label);
    return '';
  }
  return String(value);
};

// ============================================================================
// CSS INJECTION - Lädt einmalig alle Styles
// ============================================================================

const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('baunity-wizard-styles')) return;

  const style = document.createElement('style');
  style.id = 'baunity-wizard-styles';
  style.textContent = `
    /* ═══════════════════════════════════════════════════════════════════════
       BAUNITY WIZARD UI - STRIPE/VERCEL STYLE
       Clean, Modern, Professional
       ═══════════════════════════════════════════════════════════════════════ */

    /* Base Container */
    .lw-container {
      min-height: 100vh;
      background: #060b18;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
    }

    /* Glass Card - Clean Version */
    .lw-glass {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
    }
    .lw-glass.selected {
      border-color: #3b82f6;
      background: rgba(59,130,246,0.08);
    }

    /* Card Grid */
    .lw-card-grid { display: grid; gap: 12px; }
    .lw-card-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
    .lw-card-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    .lw-card-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
    .lw-card-grid.cols-5 { grid-template-columns: repeat(5, 1fr); }
    @media (max-width: 768px) { .lw-card-grid { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (max-width: 480px) { .lw-card-grid { grid-template-columns: 1fr !important; } }

    /* Card Option */
    .lw-card-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      background: #060b18;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      cursor: pointer;
      transition: all 150ms ease;
      text-align: center;
    }
    .lw-card-option:hover {
      border-color: rgba(255,255,255,0.25);
      background: #18181b;
    }
    .lw-card-option.selected {
      background: rgba(59,130,246,0.1);
      border-color: #3b82f6;
    }
    .lw-card-option .icon { font-size: 28px; margin-bottom: 10px; }
    .lw-card-option .label { font-size: 14px; font-weight: 500; color: #fafafa; }
    .lw-card-option.selected .label { color: #3b82f6; }

    /* Multi Select Card */
    .lw-multi-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #060b18;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .lw-multi-option:hover { border-color: rgba(255,255,255,0.25); }
    .lw-multi-option.selected {
      background: rgba(59,130,246,0.08);
      border-color: #3b82f6;
    }
    .lw-multi-check {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 150ms ease;
    }
    .lw-multi-check.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }
    .lw-multi-check.checked::after { content: '✓'; color: white; font-size: 12px; font-weight: 600; }

    /* Input - Stripe Style */
    .lw-input-wrap { margin-bottom: 16px; }
    .lw-input-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #fafafa;
      margin-bottom: 8px;
    }
    .lw-input-label .required { color: #ef4444; margin-left: 2px; }
    .lw-input {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      background: #060b18;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      color: #fafafa;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
      box-sizing: border-box;
    }
    .lw-input::placeholder { color: #52525b; }
    .lw-input:hover { border-color: rgba(255,255,255,0.2); }
    .lw-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
    }
    .lw-input:disabled {
      background: #27272a;
      color: #71717a;
      cursor: not-allowed;
    }
    .lw-input-suffix {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #71717a;
      font-size: 13px;
    }
    .lw-input-container { position: relative; }
    .lw-input.has-suffix { padding-right: 50px; }
    .lw-input-error {
      font-size: 12px;
      color: #ef4444;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .lw-input.has-error { border-color: #ef4444; }
    .lw-input.has-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
    .lw-field-hint { font-size: 12px; color: #71717a; margin-top: 6px; }

    /* Select - Stripe Style */
    .lw-select {
      width: 100%;
      height: 40px;
      padding: 0 36px 0 12px;
      background: #060b18;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      color: #fafafa;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      appearance: none;
      cursor: pointer;
      box-sizing: border-box;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .lw-select:hover { border-color: rgba(255,255,255,0.2); }
    .lw-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
    }
    .lw-select option { background: #18181b; color: #fafafa; }
    .lw-select-wrap { position: relative; }
    .lw-select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #71717a;
      pointer-events: none;
      font-size: 10px;
    }

    /* Button - Clean Style */
    .lw-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      transition: all 150ms ease;
      border: none;
    }
    .lw-btn-primary {
      background: #3b82f6;
      color: white;
    }
    .lw-btn-primary:hover {
      background: #2563eb;
    }
    .lw-btn-primary:active {
      background: #1d4ed8;
    }
    .lw-btn-secondary {
      background: transparent;
      color: #fafafa;
      border: 1px solid rgba(255,255,255,0.12);
    }
    .lw-btn-secondary:hover {
      background: #27272a;
      border-color: rgba(255,255,255,0.2);
    }
    .lw-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Progress */
    .lw-progress {
      width: 100%;
      height: 4px;
      background: #27272a;
      border-radius: 2px;
      overflow: hidden;
    }
    .lw-progress-bar {
      height: 100%;
      background: #3b82f6;
      border-radius: 2px;
      transition: width 300ms ease;
    }

    /* Badge */
    .lw-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      font-size: 11px;
      font-weight: 500;
      border-radius: 9999px;
    }
    .lw-badge-emerald { background: rgba(34,197,94,0.15); color: #22c55e; }
    .lw-badge-amber { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .lw-badge-cyan { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .lw-badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }

    /* Alert */
    .lw-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid;
      margin-bottom: 16px;
    }
    .lw-alert-info {
      background: rgba(59,130,246,0.1);
      border-color: rgba(59,130,246,0.2);
      color: #93c5fd;
    }
    .lw-alert-success {
      background: rgba(34,197,94,0.1);
      border-color: rgba(34,197,94,0.2);
      color: #86efac;
    }
    .lw-alert-warning {
      background: rgba(245,158,11,0.1);
      border-color: rgba(245,158,11,0.2);
      color: #fcd34d;
    }
    .lw-alert-error {
      background: rgba(239,68,68,0.1);
      border-color: rgba(239,68,68,0.2);
      color: #fca5a5;
    }
    .lw-alert-icon { font-size: 18px; flex-shrink: 0; line-height: 1; }
    .lw-alert-title { font-weight: 600; margin-bottom: 4px; color: #fafafa; }
    .lw-alert-text { font-size: 14px; color: #a1a1aa; }

    /* Section */
    .lw-section { margin-bottom: 32px; }
    .lw-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .lw-section-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(59,130,246,0.15);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 10px;
      font-size: 20px;
    }
    .lw-section-title { font-size: 16px; font-weight: 600; color: #fafafa; margin: 0; }
    .lw-section-subtitle { font-size: 14px; color: #71717a; margin: 0; }

    /* Checkbox - Clean Style */
    .lw-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 4px 0;
    }
    .lw-checkbox-box {
      width: 18px;
      height: 18px;
      margin-top: 1px;
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 150ms ease;
    }
    .lw-checkbox-box.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }
    .lw-checkbox-box.checked::after { content: '✓'; color: white; font-size: 11px; font-weight: 600; }
    .lw-checkbox-label { font-size: 14px; font-weight: 500; color: #fafafa; margin: 0; line-height: 1.4; }
    .lw-checkbox-desc { font-size: 13px; color: #71717a; margin: 2px 0 0 0; line-height: 1.4; }
    .lw-checkbox-desc a { color: #3b82f6; text-decoration: none; }
    .lw-checkbox-desc a:hover { text-decoration: underline; }

    /* Header */
    .lw-header {
      position: sticky;
      top: 0;
      z-index: 20;
      padding: 16px 24px;
      background: rgba(9,9,11,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .lw-header-content {
      max-width: 1024px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .lw-logo { display: flex; align-items: center; gap: 12px; }
    .lw-logo-icon {
      width: 36px;
      height: 36px;
      background: #3b82f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .lw-logo-text { font-size: 16px; font-weight: 600; margin: 0; color: #fafafa; }
    .lw-logo-sub { font-size: 12px; color: #71717a; margin: 0; }

    /* Nav */
    .lw-nav {
      display: flex;
      gap: 4px;
      padding: 12px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      overflow-x: auto;
      max-width: 1024px;
      margin: 0 auto;
    }
    .lw-nav-step {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 6px;
      background: transparent;
      color: #71717a;
      white-space: nowrap;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      transition: all 150ms ease;
    }
    .lw-nav-step:hover:not(:disabled) {
      background: #27272a;
      color: #a1a1aa;
    }
    .lw-nav-step.active {
      background: rgba(59,130,246,0.15);
      color: #3b82f6;
    }
    .lw-nav-step:disabled { opacity: 0.4; cursor: not-allowed; }
    .lw-nav-step .icon { font-size: 14px; }

    /* Main */
    .lw-main { padding: 32px 24px; max-width: 900px; margin: 0 auto; }

    /* Actions */
    .lw-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    /* Grid Helpers */
    .lw-grid { display: grid; gap: 16px; }
    .lw-grid-2 { grid-template-columns: repeat(2, 1fr); }
    .lw-grid-3 { grid-template-columns: repeat(3, 1fr); }
    .lw-grid-4 { grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 640px) { .lw-grid-2, .lw-grid-3, .lw-grid-4 { grid-template-columns: 1fr; } }

    /* Spacing */
    .lw-space-y > * + * { margin-top: 16px; }

    /* Validation Summary */
    .lw-validation-summary {
      padding: 16px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .lw-validation-summary-title {
      font-size: 14px;
      font-weight: 600;
      color: #fafafa;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .lw-validation-summary-list { list-style: none; padding: 0; margin: 0; }
    .lw-validation-summary-list li {
      font-size: 13px;
      color: #a1a1aa;
      padding: 4px 0 4px 16px;
      position: relative;
    }
    .lw-validation-summary-list li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #ef4444;
    }
  `;
  document.head.appendChild(style);
};

// Initialisiere Styles beim Import
if (typeof window !== 'undefined') {
  injectStyles();
}

// ============================================================================
// GLASS CARD
// ============================================================================

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', selected, hover, onClick }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div
      className={`lw-glass ${selected ? 'selected' : ''} ${className}`}
      onClick={onClick}
      style={hover ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
};

// ============================================================================
// INPUT
// ============================================================================

interface InputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  suffix?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, onBlur, onFocus, placeholder, type = 'text', required, error, suffix, maxLength, className = '', disabled, hint }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div className={`lw-input-wrap ${className}`}>
      {label && (
        <label className="lw-input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="lw-input-container">
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`lw-input ${suffix ? 'has-suffix' : ''} ${error ? 'has-error' : ''}`}
          style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        />
        {suffix && <span className="lw-input-suffix">{suffix}</span>}
      </div>
      {hint && !error && <p className="lw-field-hint">{hint}</p>}
      {error && <p className="lw-input-error">⚠️ {safeString(error)}</p>}
    </div>
  );
};

// ============================================================================
// SELECT
// ============================================================================

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  options: (string | { value: string; label: string })[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, onBlur, options, placeholder = 'Bitte wählen...', required, className = '', error }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div className={`lw-input-wrap ${className}`}>
      {label && (
        <label className="lw-input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="lw-select-wrap">
        <select value={value || ''} onChange={(e) => onChange?.(e.target.value)} onBlur={onBlur} className="lw-select">
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value;
            const l = typeof opt === 'string' ? opt : opt.label;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
        <span className="lw-select-arrow">▼</span>
      </div>
      {error && <p className="lw-input-error">⚠️ {safeString(error)}</p>}
    </div>
  );
};

// ============================================================================
// CARD SELECT
// ============================================================================

interface CardOption {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

interface CardSelectProps {
  options: CardOption[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4 | 5;
  size?: 'compact' | 'normal';
}

export const CardSelect: React.FC<CardSelectProps> = ({ options, value, onChange, columns = 3 }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div className={`lw-card-grid cols-${columns}`}>
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`lw-card-option ${value === opt.value ? 'selected' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          <span className="icon">{opt.icon}</span>
          <span className="label">{opt.label}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MULTI SELECT
// ============================================================================

interface MultiSelectOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange }) => {
  useEffect(() => { injectStyles(); }, []);

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div className="lw-space-y">
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`lw-multi-option ${value.includes(opt.value) ? 'selected' : ''}`}
          onClick={() => toggle(opt.value)}
        >
          <div className={`lw-multi-check ${value.includes(opt.value) ? 'checked' : ''}`} />
          {opt.icon && <span style={{ fontSize: 24 }}>{opt.icon}</span>}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, color: 'white' }}>{opt.label}</div>
            {opt.description && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{opt.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// CHECKBOX
// ============================================================================

interface CheckboxProps {
  label: string;
  description?: string | React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, description, checked, onChange, disabled, required, error }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div>
      <div
        className="lw-checkbox"
        onClick={() => !disabled && onChange?.(!checked)}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
      >
        <div className={`lw-checkbox-box ${checked ? 'checked' : ''}`} />
        <div>
          <p className="lw-checkbox-label">
            {label}
            {required && <span style={{ color: '#638bff', marginLeft: 4 }}>*</span>}
          </p>
          {description && (
            typeof description === 'string'
              ? <p className="lw-checkbox-desc" dangerouslySetInnerHTML={{ __html: description }} />
              : <div className="lw-checkbox-desc">{description}</div>
          )}
        </div>
      </div>
      {error && <p className="lw-input-error" style={{ marginLeft: 36 }}>⚠️ {safeString(error)}</p>}
    </div>
  );
};

// ============================================================================
// ALERT
// ============================================================================

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children }) => {
  useEffect(() => { injectStyles(); }, []);
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  return (
    <div className={`lw-alert lw-alert-${type}`}>
      <span className="lw-alert-icon">{icons[type]}</span>
      <div>
        {title && <div className="lw-alert-title">{title}</div>}
        <div className="lw-alert-text">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div className="lw-section-header">
      <div className="lw-section-icon">{icon}</div>
      <div>
        <h3 className="lw-section-title">{title}</h3>
        {subtitle && <p className="lw-section-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

// ============================================================================
// BUTTON
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }) => {
  useEffect(() => { injectStyles(); }, []);
  return (
    <button
      type={type}
      className={`lw-btn lw-btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ============================================================================
// PROGRESS
// ============================================================================

interface ProgressProps {
  value: number;
  max?: number;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100 }) => {
  useEffect(() => { injectStyles(); }, []);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="lw-progress">
      <div className="lw-progress-bar" style={{ width: `${percentage}%` }} />
    </div>
  );
};

// ============================================================================
// BADGE
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'cyan' | 'red';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'emerald' }) => {
  useEffect(() => { injectStyles(); }, []);
  return <span className={`lw-badge lw-badge-${variant}`}>{children}</span>;
};

// ============================================================================
// VALIDATION SUMMARY
// ============================================================================

interface ValidationSummaryProps {
  errors: string[];
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ errors }) => {
  useEffect(() => { injectStyles(); }, []);
  if (errors.length === 0) return null;
  return (
    <div className="lw-validation-summary">
      <div className="lw-validation-summary-title">⚠️ Bitte korrigieren Sie folgende Fehler:</div>
      <ul className="lw-validation-summary-list">
        {errors.map((err, i) => (
          <li key={i}>{safeString(err)}</li>
        ))}
      </ul>
    </div>
  );
};
