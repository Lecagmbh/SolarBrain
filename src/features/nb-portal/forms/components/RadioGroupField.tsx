// src/features/nb-portal/forms/components/RadioGroupField.tsx
/**
 * Radio group field component for single selection
 */

import React from 'react';
import { Check } from 'lucide-react';
import { FieldWrapper } from './FieldWrapper';
import type { BaseFieldProps, FormOption } from '../types/form.types';

interface RadioGroupFieldProps extends BaseFieldProps {
  options: FormOption[];
}

export function RadioGroupField({
  component,
  value,
  error,
  touched,
  onChange,
  onBlur,
  options
}: RadioGroupFieldProps) {
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    onBlur();
  };

  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={error}
      touched={touched}
      helpText={component.helpText?.de}
    >
      <div className="nb-radio-group">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`nb-radio-option ${isSelected ? 'nb-radio-option--selected' : ''}`}
              onClick={() => handleSelect(option.value)}
              aria-pressed={isSelected}
            >
              <div className={`nb-radio-indicator ${isSelected ? 'nb-radio-indicator--selected' : ''}`}>
                {isSelected && <Check size={12} />}
              </div>
              <div className="nb-radio-content">
                <span className="nb-radio-label">{option.label.de}</span>
                {option.description && (
                  <span className="nb-radio-description">{option.description.de}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <style>{radioGroupStyles}</style>
    </FieldWrapper>
  );
}

const radioGroupStyles = `
  .nb-radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .nb-radio-option {
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

  .nb-radio-option:hover {
    background: rgba(31, 41, 55, 0.8);
    border-color: rgba(168, 85, 247, 0.3);
  }

  .nb-radio-option--selected {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.5);
  }

  .nb-radio-option--selected:hover {
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.6);
  }

  .nb-radio-indicator {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-top: 1px;
  }

  .nb-radio-option:hover .nb-radio-indicator {
    border-color: rgba(168, 85, 247, 0.5);
  }

  .nb-radio-indicator--selected {
    background: #a855f7;
    border-color: #a855f7;
  }

  .nb-radio-indicator--selected svg {
    color: white;
  }

  .nb-radio-content {
    flex: 1;
    min-width: 0;
  }

  .nb-radio-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
  }

  .nb-radio-option--selected .nb-radio-label {
    color: #e9d5ff;
  }

  .nb-radio-description {
    display: block;
    margin-top: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.4;
  }

  .nb-radio-option--selected .nb-radio-description {
    color: rgba(233, 213, 255, 0.7);
  }
`;

export default RadioGroupField;
