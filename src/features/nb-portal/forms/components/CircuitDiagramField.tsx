// src/features/nb-portal/forms/components/CircuitDiagramField.tsx
/**
 * Circuit diagram field with image display and checkbox confirmation
 */

import React, { useState } from 'react';
import { Check, ZoomIn, ZoomOut, X, Maximize2 } from 'lucide-react';
import { FieldWrapper } from './FieldWrapper';
import type { BaseFieldProps } from '../types/form.types';

interface CircuitDiagramFieldProps extends BaseFieldProps {
  imageUrl?: string;
  confirmationText?: string;
}

export function CircuitDiagramField({
  component,
  value,
  error,
  touched,
  onChange,
  onBlur,
  imageUrl,
  confirmationText
}: CircuitDiagramFieldProps) {
  const isConfirmed = value === true;
  const [isZoomed, setIsZoomed] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleConfirmChange = () => {
    onChange(!isConfirmed);
    onBlur();
  };

  const imgSrc = imageUrl || component.imageUrl || '/images/circuit-diagram-placeholder.svg';
  const confirmText = confirmationText || component.confirmationText?.de ||
    'Ich bestätige, dass das Schaltbild korrekt ist';

  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={error}
      touched={touched}
      helpText={component.helpText?.de}
    >
      <div className="nb-circuit-container">
        {/* Image Container */}
        <div className={`nb-circuit-image-container ${isZoomed ? 'nb-circuit-image-container--zoomed' : ''}`}>
          <img
            src={imgSrc}
            alt="Schaltbild"
            className="nb-circuit-image"
            onClick={() => setShowFullscreen(true)}
          />

          {/* Zoom Controls */}
          <div className="nb-circuit-controls">
            <button
              type="button"
              className="nb-circuit-control-btn"
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? 'Verkleinern' : 'Vergrößern'}
            >
              {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            </button>
            <button
              type="button"
              className="nb-circuit-control-btn"
              onClick={() => setShowFullscreen(true)}
              title="Vollbild"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <button
          type="button"
          className={`nb-circuit-confirm ${isConfirmed ? 'nb-circuit-confirm--checked' : ''}`}
          onClick={handleConfirmChange}
        >
          <div className={`nb-circuit-checkbox ${isConfirmed ? 'nb-circuit-checkbox--checked' : ''}`}>
            {isConfirmed && <Check size={14} />}
          </div>
          <span className="nb-circuit-confirm-text">{confirmText}</span>
        </button>

        {/* Fullscreen Modal */}
        {showFullscreen && (
          <div className="nb-circuit-fullscreen" onClick={() => setShowFullscreen(false)}>
            <div className="nb-circuit-fullscreen-content" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="nb-circuit-fullscreen-close"
                onClick={() => setShowFullscreen(false)}
              >
                <X size={24} />
              </button>
              <img
                src={imgSrc}
                alt="Schaltbild"
                className="nb-circuit-fullscreen-image"
              />
            </div>
          </div>
        )}
      </div>
      <style>{circuitStyles}</style>
    </FieldWrapper>
  );
}

const circuitStyles = `
  .nb-circuit-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .nb-circuit-image-container {
    position: relative;
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    padding: 16px;
    transition: all 0.3s ease;
  }

  .nb-circuit-image-container--zoomed {
    padding: 0;
  }

  .nb-circuit-image {
    width: 100%;
    height: auto;
    max-height: 300px;
    object-fit: contain;
    cursor: pointer;
    transition: transform 0.3s ease;
  }

  .nb-circuit-image-container--zoomed .nb-circuit-image {
    max-height: 500px;
  }

  .nb-circuit-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 8px;
  }

  .nb-circuit-control-btn {
    padding: 8px;
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .nb-circuit-control-btn:hover {
    background: rgba(168, 85, 247, 0.2);
    border-color: rgba(168, 85, 247, 0.3);
    color: #a855f7;
  }

  .nb-circuit-confirm {
    display: flex;
    align-items: center;
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

  .nb-circuit-confirm:hover {
    background: rgba(31, 41, 55, 0.8);
    border-color: rgba(168, 85, 247, 0.3);
  }

  .nb-circuit-confirm--checked {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.4);
  }

  .nb-circuit-checkbox {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .nb-circuit-confirm:hover .nb-circuit-checkbox {
    border-color: rgba(168, 85, 247, 0.5);
  }

  .nb-circuit-checkbox--checked {
    background: #a855f7;
    border-color: #a855f7;
  }

  .nb-circuit-checkbox--checked svg {
    color: white;
  }

  .nb-circuit-confirm-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }

  .nb-circuit-confirm--checked .nb-circuit-confirm-text {
    color: #e9d5ff;
  }

  /* Fullscreen Modal */
  .nb-circuit-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .nb-circuit-fullscreen-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }

  .nb-circuit-fullscreen-close {
    position: absolute;
    top: -48px;
    right: 0;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .nb-circuit-fullscreen-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .nb-circuit-fullscreen-image {
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 12px;
  }
`;

export default CircuitDiagramField;
