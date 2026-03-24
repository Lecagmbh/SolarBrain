// src/features/nb-portal/forms/DynamicFormRenderer.tsx
/**
 * Dynamic Form Renderer
 * =====================
 * Renders form components based on API-provided form definition
 */

import React, { useCallback } from 'react';
import {
  RadioGroupField,
  FileUploadField,
  FloorplanField,
  CircuitDiagramField,
  FormSection,
  FieldWrapper
} from './components';
import { useDynamicFormStore } from './store/dynamicFormStore';
import { uploadFormFile, deleteFormFile } from '../nbPortalApi';
import type {
  FormDefinition,
  FormGroup,
  FormComponent,
  FormValues,
  FormErrors,
  UploadedFile
} from './types/form.types';

interface DynamicFormRendererProps {
  definition: FormDefinition;
  currentGroupIndex: number;
  values: FormValues;
  errors: FormErrors;
  touched: Set<string>;
  uploadedFiles: Record<string, UploadedFile[]>;
  portalId: string;
  productId: string;
  onValueChange: (key: string, value: unknown) => void;
  onTouched: (key: string) => void;
}

export function DynamicFormRenderer({
  definition,
  currentGroupIndex,
  values,
  errors,
  touched,
  uploadedFiles,
  portalId,
  productId,
  onValueChange,
  onTouched
}: DynamicFormRendererProps) {
  const currentGroup = definition.groups[currentGroupIndex];

  const {
    addUploadedFile,
    updateFileProgress,
    setFileError,
    removeUploadedFile
  } = useDynamicFormStore();

  // Check if a component should be displayed based on conditional rules
  const shouldDisplayComponent = useCallback((component: FormComponent): boolean => {
    if (!component.conditionalDisplay) return true;

    const { dependsOn, condition, value: targetValue } = component.conditionalDisplay;
    const dependsOnValue = values[dependsOn];

    switch (condition) {
      case 'equals':
        return dependsOnValue === targetValue;
      case 'notEquals':
        return dependsOnValue !== targetValue;
      case 'contains':
        if (Array.isArray(dependsOnValue)) {
          return dependsOnValue.includes(targetValue);
        }
        return String(dependsOnValue).includes(String(targetValue));
      case 'isEmpty':
        return !dependsOnValue || (Array.isArray(dependsOnValue) && dependsOnValue.length === 0);
      case 'isNotEmpty':
        return !!dependsOnValue && (!Array.isArray(dependsOnValue) || dependsOnValue.length > 0);
      default:
        return true;
    }
  }, [values]);

  // Handle file upload
  const handleFileUpload = useCallback(async (fieldKey: string, file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add pending file
    addUploadedFile(fieldKey, {
      id: tempId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    });

    try {
      const result = await uploadFormFile(
        portalId,
        productId,
        fieldKey,
        file,
        (progress) => updateFileProgress(fieldKey, tempId, progress)
      );

      // Update with real file info
      removeUploadedFile(fieldKey, tempId);
      addUploadedFile(fieldKey, result);
    } catch (err) {
      setFileError(fieldKey, tempId, 'Upload fehlgeschlagen');
    }
  }, [portalId, productId, addUploadedFile, updateFileProgress, removeUploadedFile, setFileError]);

  // Handle file removal
  const handleFileRemove = useCallback(async (fieldKey: string, fileId: string) => {
    try {
      await deleteFormFile(portalId, productId, fileId);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
    removeUploadedFile(fieldKey, fileId);
  }, [portalId, productId, removeUploadedFile]);

  // Render a single component
  const renderComponent = (component: FormComponent) => {
    if (!shouldDisplayComponent(component)) return null;

    const baseProps = {
      component,
      value: values[component.key],
      error: errors[component.key],
      touched: touched.has(component.key),
      onChange: (value: unknown) => onValueChange(component.key, value),
      onBlur: () => onTouched(component.key)
    };

    switch (component.controlType) {
      case 'radio':
        return (
          <RadioGroupField
            key={component.key}
            {...baseProps}
            options={component.options || []}
          />
        );

      case 'upload':
        return (
          <FileUploadField
            key={component.key}
            {...baseProps}
            acceptedFileTypes={component.acceptedFileTypes}
            maxFileSize={component.maxFileSize}
            maxFiles={component.maxFiles}
            uploadedFiles={uploadedFiles[component.key] || []}
            onUpload={(file) => handleFileUpload(component.key, file)}
            onRemove={(fileId) => handleFileRemove(component.key, fileId)}
          />
        );

      case 'floorplan':
      case 'address':
        return (
          <FloorplanField
            key={component.key}
            {...baseProps}
            portalId={portalId}
          />
        );

      case 'circuitdiagram':
        return (
          <CircuitDiagramField
            key={component.key}
            {...baseProps}
            imageUrl={component.imageUrl}
            confirmationText={component.confirmationText?.de}
          />
        );

      case 'checkbox':
        return (
          <CheckboxField
            key={component.key}
            {...baseProps}
          />
        );

      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <TextField
            key={component.key}
            {...baseProps}
            type={component.controlType}
          />
        );

      case 'textarea':
        return (
          <TextAreaField
            key={component.key}
            {...baseProps}
          />
        );

      case 'select':
        return (
          <SelectField
            key={component.key}
            {...baseProps}
            options={component.options || []}
          />
        );

      default:
        console.warn(`Unknown control type: ${component.controlType}`);
        return null;
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="nb-form-renderer">
      <FormSection
        title={currentGroup.title?.de}
        description={currentGroup.description?.de}
      >
        {currentGroup.components.map(component => renderComponent(component))}
      </FormSection>
      <style>{rendererStyles}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE FIELD COMPONENTS (inline for basic controls)
// ═══════════════════════════════════════════════════════════════════════════

interface TextFieldProps {
  component: FormComponent;
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  type?: string;
}

function TextField({ component, value, error, touched, onChange, onBlur, type = 'text' }: TextFieldProps) {
  const inputType = type === 'phone' ? 'tel' : type;

  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={error}
      touched={touched}
      helpText={component.helpText?.de}
    >
      <input
        type={inputType}
        value={String(value || '')}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={onBlur}
        placeholder={component.placeholder?.de}
        className="nb-text-input"
      />
      <style>{textFieldStyles}</style>
    </FieldWrapper>
  );
}

interface TextAreaFieldProps {
  component: FormComponent;
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

function TextAreaField({ component, value, error, touched, onChange, onBlur }: TextAreaFieldProps) {
  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={error}
      touched={touched}
      helpText={component.helpText?.de}
    >
      <textarea
        value={String(value || '')}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={component.placeholder?.de}
        className="nb-textarea-input"
        rows={4}
      />
      <style>{textFieldStyles}</style>
    </FieldWrapper>
  );
}

interface SelectFieldProps {
  component: FormComponent;
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  options: Array<{ value: string; label: { de: string } }>;
}

function SelectField({ component, value, error, touched, onChange, onBlur, options }: SelectFieldProps) {
  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={error}
      touched={touched}
      helpText={component.helpText?.de}
    >
      <select
        value={String(value || '')}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className="nb-select-input"
      >
        <option value="">{component.placeholder?.de || 'Bitte wählen...'}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label.de}
          </option>
        ))}
      </select>
      <style>{textFieldStyles}</style>
    </FieldWrapper>
  );
}

interface CheckboxFieldProps {
  component: FormComponent;
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

function CheckboxField({ component, value, error, touched, onChange, onBlur }: CheckboxFieldProps) {
  const isChecked = value === true;

  return (
    <FieldWrapper
      label=""
      required={component.required}
      error={error}
      touched={touched}
    >
      <button
        type="button"
        className={`nb-checkbox-field ${isChecked ? 'nb-checkbox-field--checked' : ''}`}
        onClick={() => { onChange(!isChecked); onBlur(); }}
      >
        <div className={`nb-checkbox-box ${isChecked ? 'nb-checkbox-box--checked' : ''}`}>
          {isChecked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className="nb-checkbox-label">
          {component.fieldName.de}
          {component.required && <span className="nb-checkbox-required">*</span>}
        </span>
      </button>
      <style>{checkboxStyles}</style>
    </FieldWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const rendererStyles = `
  .nb-form-renderer {
    animation: nb-form-fade-in 0.3s ease;
  }

  @keyframes nb-form-fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const textFieldStyles = `
  .nb-text-input,
  .nb-textarea-input,
  .nb-select-input {
    width: 100%;
    padding: 12px 14px;
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.95);
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }

  .nb-text-input::placeholder,
  .nb-textarea-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .nb-text-input:focus,
  .nb-textarea-input:focus,
  .nb-select-input:focus {
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }

  .nb-textarea-input {
    resize: vertical;
    min-height: 100px;
  }

  .nb-select-input {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 40px;
  }

  .nb-select-input option {
    background: #1f2937;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const checkboxStyles = `
  .nb-checkbox-field {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
  }

  .nb-checkbox-field:hover {
    background: rgba(31, 41, 55, 0.8);
    border-color: rgba(168, 85, 247, 0.3);
  }

  .nb-checkbox-field--checked {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.4);
  }

  .nb-checkbox-box {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-top: 1px;
  }

  .nb-checkbox-field:hover .nb-checkbox-box {
    border-color: rgba(168, 85, 247, 0.5);
  }

  .nb-checkbox-box--checked {
    background: #a855f7;
    border-color: #a855f7;
    color: white;
  }

  .nb-checkbox-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
  }

  .nb-checkbox-field--checked .nb-checkbox-label {
    color: #e9d5ff;
  }

  .nb-checkbox-required {
    color: #a855f7;
    margin-left: 4px;
  }
`;

export default DynamicFormRenderer;
