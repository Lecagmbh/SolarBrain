// src/features/nb-portal/forms/components/FieldWrapper.tsx
/**
 * Common wrapper for form fields with label, error, and help text
 */

import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  touched?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({
  label,
  required = false,
  error,
  helpText,
  touched = false,
  children,
  className = ''
}: FieldWrapperProps) {
  const showError = touched && error;

  return (
    <div className={`nb-field-wrapper ${className}`}>
      <label className="nb-field-label">
        <span className="nb-field-label-text">
          {label}
          {required && <span className="nb-field-required">*</span>}
        </span>
        {helpText && (
          <span className="nb-field-help-icon" title={helpText}>
            <HelpCircle size={14} />
          </span>
        )}
      </label>

      <div className={`nb-field-control ${showError ? 'nb-field-control--error' : ''}`}>
        {children}
      </div>

      {showError && (
        <div className="nb-field-error">
          <AlertCircle size={14} />
          <span>{safeString(error)}</span>
        </div>
      )}

      {helpText && !showError && (
        <p className="nb-field-help">{helpText}</p>
      )}

      <style>{fieldWrapperStyles}</style>
    </div>
  );
}

const fieldWrapperStyles = `
  .nb-field-wrapper {
    margin-bottom: 20px;
  }

  .nb-field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
  }

  .nb-field-label-text {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nb-field-required {
    color: #a855f7;
    font-weight: 600;
  }

  .nb-field-help-icon {
    color: rgba(255, 255, 255, 0.4);
    cursor: help;
    display: flex;
    align-items: center;
  }

  .nb-field-help-icon:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .nb-field-control {
    position: relative;
  }

  .nb-field-control--error {
    animation: nb-field-shake 0.3s ease-in-out;
  }

  @keyframes nb-field-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .nb-field-error {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 13px;
    color: #f87171;
  }

  .nb-field-error svg {
    flex-shrink: 0;
  }

  .nb-field-help {
    margin-top: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.4;
  }
`;

export default FieldWrapper;
