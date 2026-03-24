// src/features/nb-portal/forms/components/FormSection.tsx
/**
 * Form section wrapper for grouping related fields
 */

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = ''
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`nb-form-section ${className}`}>
      {(title || description) && (
        <div
          className={`nb-form-section-header ${collapsible ? 'nb-form-section-header--clickable' : ''}`}
          onClick={toggleExpanded}
        >
          <div className="nb-form-section-title-wrapper">
            {title && <h3 className="nb-form-section-title">{title}</h3>}
            {description && <p className="nb-form-section-description">{description}</p>}
          </div>
          {collapsible && (
            <button type="button" className="nb-form-section-toggle">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      )}

      {(!collapsible || isExpanded) && (
        <div className="nb-form-section-content">
          {children}
        </div>
      )}

      <style>{sectionStyles}</style>
    </div>
  );
}

const sectionStyles = `
  .nb-form-section {
    margin-bottom: 32px;
  }

  .nb-form-section:last-child {
    margin-bottom: 0;
  }

  .nb-form-section-header {
    margin-bottom: 20px;
  }

  .nb-form-section-header--clickable {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    cursor: pointer;
    padding: 12px 16px;
    margin: -12px -16px 20px;
    border-radius: 10px;
    transition: background 0.2s ease;
  }

  .nb-form-section-header--clickable:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .nb-form-section-title-wrapper {
    flex: 1;
    min-width: 0;
  }

  .nb-form-section-title {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
  }

  .nb-form-section-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin: 6px 0 0;
    line-height: 1.5;
  }

  .nb-form-section-toggle {
    flex-shrink: 0;
    padding: 4px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 12px;
    transition: all 0.2s ease;
  }

  .nb-form-section-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  .nb-form-section-content {
    animation: nb-section-fade-in 0.2s ease;
  }

  @keyframes nb-section-fade-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default FormSection;
