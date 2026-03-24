// src/features/nb-portal/forms/types/form.types.ts
/**
 * Type definitions for the Dynamic Form Renderer
 * Based on Stromnetz Berlin API response structure
 */

// Localized text field
export interface LocalizedText {
  de: string;
  en?: string;
}

// Form option for radio/select fields
export interface FormOption {
  value: string;
  label: LocalizedText;
  icon?: string;
  description?: LocalizedText;
}

// Validation rule definition
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'custom';
  value?: string | number;
  message: LocalizedText;
}

// Conditional display rule
export interface ConditionalRule {
  dependsOn: string;
  condition: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value?: string | number | boolean | string[];
}

// Control types supported by the renderer
export type ControlType =
  | 'radio'
  | 'upload'
  | 'floorplan'
  | 'circuitdiagram'
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'email'
  | 'phone'
  | 'address';

// Single form component/field
export interface FormComponent {
  key: string;
  fieldName: LocalizedText;
  controlType: ControlType;
  options?: FormOption[];
  required: boolean;
  defaultValue?: unknown;
  validation?: ValidationRule[];
  conditionalDisplay?: ConditionalRule;
  helpText?: LocalizedText;
  placeholder?: LocalizedText;
  // For upload fields
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  // For floorplan
  mapConfig?: {
    defaultCenter?: [number, number];
    defaultZoom?: number;
  };
  // For circuitdiagram
  imageUrl?: string;
  confirmationText?: LocalizedText;
}

// Group of form components
export interface FormGroup {
  id: string;
  title?: LocalizedText;
  description?: LocalizedText;
  components: FormComponent[];
}

// Full form definition from API
export interface FormDefinition {
  id: string;
  productId: string;
  productName: LocalizedText;
  version: string;
  groups: FormGroup[];
  submitUrl?: string;
}

// Form values (user input)
export type FormValues = Record<string, unknown>;

// Form errors
export type FormErrors = Record<string, string>;

// Touched fields tracking
export type TouchedFields = Set<string>;

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: FormErrors;
  warnings: string[];
}

// File upload state
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  error?: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
}

// Form submission response
export interface FormSubmissionResponse {
  success: boolean;
  submissionId?: string;
  gridnetzSubmissionId?: number;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  redirectUrl?: string;
}

// Address data for floorplan
export interface AddressData {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Props for field components
export interface BaseFieldProps {
  component: FormComponent;
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}
