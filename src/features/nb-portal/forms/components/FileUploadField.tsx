// src/features/nb-portal/forms/components/FileUploadField.tsx
/**
 * File upload field with drag & drop support
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FieldWrapper } from './FieldWrapper';
import type { BaseFieldProps, UploadedFile } from '../types/form.types';

interface FileUploadFieldProps extends BaseFieldProps {
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  uploadedFiles: UploadedFile[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (fileId: string) => void;
}

export function FileUploadField({
  component,
  error,
  touched,
  onBlur,
  acceptedFileTypes = ['*/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  uploadedFiles,
  onUpload,
  onRemove
}: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `Datei zu groß. Maximum: ${formatFileSize(maxFileSize)}`;
    }
    if (acceptedFileTypes[0] !== '*/*') {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      const isAccepted = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) return type.toLowerCase() === fileExt;
        if (type.endsWith('/*')) return mimeType.startsWith(type.slice(0, -1));
        return mimeType === type;
      });
      if (!isAccepted) {
        return `Dateityp nicht erlaubt. Erlaubt: ${acceptedFileTypes.join(', ')}`;
      }
    }
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    setLocalError(null);
    const remainingSlots = maxFiles - uploadedFiles.length;

    if (files.length > remainingSlots) {
      setLocalError(`Maximal ${maxFiles} Dateien erlaubt`);
      return;
    }

    for (const file of Array.from(files)) {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        continue;
      }
      await onUpload(file);
    }
    onBlur();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [uploadedFiles.length]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayError = localError || (touched ? error : undefined);

  return (
    <FieldWrapper
      label={component.fieldName.de}
      required={component.required}
      error={displayError}
      touched={touched || !!localError}
      helpText={component.helpText?.de}
    >
      <div className="nb-upload-container">
        {/* Drop Zone */}
        <div
          className={`nb-upload-dropzone ${isDragging ? 'nb-upload-dropzone--active' : ''} ${displayError ? 'nb-upload-dropzone--error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFileTypes.join(',')}
            multiple={maxFiles > 1}
            onChange={handleInputChange}
            className="nb-upload-input"
          />
          <Upload className="nb-upload-icon" size={32} />
          <p className="nb-upload-text">
            Dateien hierher ziehen oder <span>durchsuchen</span>
          </p>
          <p className="nb-upload-hint">
            Max. {formatFileSize(maxFileSize)} pro Datei
            {maxFiles > 1 && ` · Bis zu ${maxFiles} Dateien`}
          </p>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="nb-upload-files">
            {uploadedFiles.map((file) => (
              <div key={file.id} className={`nb-upload-file nb-upload-file--${file.status}`}>
                <div className="nb-upload-file-icon">
                  {file.status === 'uploading' && <Loader2 size={18} className="nb-upload-spinner" />}
                  {file.status === 'complete' && <CheckCircle size={18} />}
                  {file.status === 'error' && <AlertCircle size={18} />}
                  {file.status === 'pending' && <File size={18} />}
                </div>
                <div className="nb-upload-file-info">
                  <span className="nb-upload-file-name">{file.name}</span>
                  <span className="nb-upload-file-size">
                    {file.status === 'uploading' && file.progress !== undefined
                      ? `${file.progress}%`
                      : file.error || formatFileSize(file.size)
                    }
                  </span>
                </div>
                {file.status === 'uploading' && file.progress !== undefined && (
                  <div className="nb-upload-progress">
                    <div className="nb-upload-progress-bar" style={{ width: `${file.progress}%` }} />
                  </div>
                )}
                <button
                  type="button"
                  className="nb-upload-file-remove"
                  onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
                  aria-label="Datei entfernen"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{uploadStyles}</style>
    </FieldWrapper>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const uploadStyles = `
  .nb-upload-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .nb-upload-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background: rgba(31, 41, 55, 0.4);
    border: 2px dashed rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nb-upload-dropzone:hover {
    background: rgba(31, 41, 55, 0.6);
    border-color: rgba(168, 85, 247, 0.4);
  }

  .nb-upload-dropzone--active {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.6);
    border-style: solid;
  }

  .nb-upload-dropzone--error {
    border-color: rgba(248, 113, 113, 0.5);
  }

  .nb-upload-input {
    display: none;
  }

  .nb-upload-icon {
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 12px;
    transition: color 0.2s;
  }

  .nb-upload-dropzone:hover .nb-upload-icon,
  .nb-upload-dropzone--active .nb-upload-icon {
    color: #a855f7;
  }

  .nb-upload-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }

  .nb-upload-text span {
    color: #a855f7;
    font-weight: 500;
  }

  .nb-upload-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin: 8px 0 0;
  }

  .nb-upload-files {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nb-upload-file {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }

  .nb-upload-file--complete .nb-upload-file-icon {
    color: #22c55e;
  }

  .nb-upload-file--error .nb-upload-file-icon {
    color: #f87171;
  }

  .nb-upload-file--uploading .nb-upload-file-icon {
    color: #a855f7;
  }

  .nb-upload-file-icon {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.5);
  }

  .nb-upload-spinner {
    animation: nb-spin 1s linear infinite;
  }

  @keyframes nb-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .nb-upload-file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nb-upload-file-name {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nb-upload-file-size {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  .nb-upload-file--error .nb-upload-file-size {
    color: #f87171;
  }

  .nb-upload-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
  }

  .nb-upload-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #a855f7, #EAD068);
    transition: width 0.2s ease;
  }

  .nb-upload-file-remove {
    flex-shrink: 0;
    padding: 4px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .nb-upload-file-remove:hover {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }
`;

export default FileUploadField;
