// src/features/nb-portal/forms/store/dynamicFormStore.ts
/**
 * Zustand store for Dynamic Form state management
 */

import { create } from 'zustand';
import type {
  FormDefinition,
  FormValues,
  FormErrors,
  FormComponent,
  UploadedFile,
  ValidationResult
} from '../types/form.types';

interface DynamicFormState {
  // Form definition from API
  definition: FormDefinition | null;

  // User input values
  values: FormValues;

  // Validation errors
  errors: FormErrors;

  // Fields that have been touched (blurred)
  touched: Set<string>;

  // Uploaded files by field key
  uploadedFiles: Record<string, UploadedFile[]>;

  // Loading states
  loading: boolean;
  submitting: boolean;

  // Error messages
  loadError: string | null;
  submitError: string | null;

  // Multi-group navigation
  currentGroupIndex: number;

  // Portal context
  portalId: string | null;
  productId: string | null;
}

interface DynamicFormActions {
  // Initialization
  setDefinition: (definition: FormDefinition) => void;
  setContext: (portalId: string, productId: string) => void;

  // Value management
  setValue: (key: string, value: unknown) => void;
  setValues: (values: FormValues) => void;

  // Error management
  setError: (key: string, error: string | null) => void;
  setErrors: (errors: FormErrors) => void;
  clearErrors: () => void;

  // Touch tracking
  setTouched: (key: string) => void;
  setAllTouched: () => void;

  // File management
  addUploadedFile: (fieldKey: string, file: UploadedFile) => void;
  updateFileProgress: (fieldKey: string, fileId: string, progress: number) => void;
  setFileError: (fieldKey: string, fileId: string, error: string) => void;
  removeUploadedFile: (fieldKey: string, fileId: string) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setLoadError: (error: string | null) => void;
  setSubmitError: (error: string | null) => void;

  // Navigation
  nextGroup: () => void;
  prevGroup: () => void;
  goToGroup: (index: number) => void;

  // Validation
  validateField: (component: FormComponent) => string | null;
  validateGroup: (groupIndex: number) => ValidationResult;
  validateAll: () => ValidationResult;

  // Computed
  isGroupValid: (groupIndex: number) => boolean;
  canProceed: () => boolean;
  getProgress: () => number;

  // Reset
  reset: () => void;
}

const initialState: DynamicFormState = {
  definition: null,
  values: {},
  errors: {},
  touched: new Set(),
  uploadedFiles: {},
  loading: false,
  submitting: false,
  loadError: null,
  submitError: null,
  currentGroupIndex: 0,
  portalId: null,
  productId: null
};

export const useDynamicFormStore = create<DynamicFormState & DynamicFormActions>((set, get) => ({
  ...initialState,

  // Initialization
  setDefinition: (definition) => {
    // Initialize values with defaults
    const values: FormValues = {};
    definition.groups.forEach(group => {
      group.components.forEach(component => {
        if (component.defaultValue !== undefined) {
          values[component.key] = component.defaultValue;
        }
      });
    });

    set({
      definition,
      values,
      errors: {},
      touched: new Set(),
      currentGroupIndex: 0,
      loadError: null
    });
  },

  setContext: (portalId, productId) => {
    set({ portalId, productId });
  },

  // Value management
  setValue: (key, value) => {
    set(state => ({
      values: { ...state.values, [key]: value }
    }));

    // Clear error when value changes
    const { errors } = get();
    if (errors[key]) {
      set(state => {
        const newErrors = { ...state.errors };
        delete newErrors[key];
        return { errors: newErrors };
      });
    }
  },

  setValues: (values) => {
    set({ values });
  },

  // Error management
  setError: (key, error) => {
    set(state => {
      if (error === null) {
        const newErrors = { ...state.errors };
        delete newErrors[key];
        return { errors: newErrors };
      }
      return { errors: { ...state.errors, [key]: error } };
    });
  },

  setErrors: (errors) => {
    set({ errors });
  },

  clearErrors: () => {
    set({ errors: {} });
  },

  // Touch tracking
  setTouched: (key) => {
    set(state => {
      const newTouched = new Set(state.touched);
      newTouched.add(key);
      return { touched: newTouched };
    });
  },

  setAllTouched: () => {
    const { definition } = get();
    if (!definition) return;

    const allKeys = new Set<string>();
    definition.groups.forEach(group => {
      group.components.forEach(component => {
        allKeys.add(component.key);
      });
    });

    set({ touched: allKeys });
  },

  // File management
  addUploadedFile: (fieldKey, file) => {
    set(state => ({
      uploadedFiles: {
        ...state.uploadedFiles,
        [fieldKey]: [...(state.uploadedFiles[fieldKey] || []), file]
      }
    }));
  },

  updateFileProgress: (fieldKey, fileId, progress) => {
    set(state => ({
      uploadedFiles: {
        ...state.uploadedFiles,
        [fieldKey]: (state.uploadedFiles[fieldKey] || []).map(f =>
          f.id === fileId ? { ...f, progress, status: 'uploading' as const } : f
        )
      }
    }));
  },

  setFileError: (fieldKey, fileId, error) => {
    set(state => ({
      uploadedFiles: {
        ...state.uploadedFiles,
        [fieldKey]: (state.uploadedFiles[fieldKey] || []).map(f =>
          f.id === fileId ? { ...f, error, status: 'error' as const } : f
        )
      }
    }));
  },

  removeUploadedFile: (fieldKey, fileId) => {
    set(state => ({
      uploadedFiles: {
        ...state.uploadedFiles,
        [fieldKey]: (state.uploadedFiles[fieldKey] || []).filter(f => f.id !== fileId)
      }
    }));
  },

  // Loading states
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setLoadError: (loadError) => set({ loadError }),
  setSubmitError: (submitError) => set({ submitError }),

  // Navigation
  nextGroup: () => {
    const { definition, currentGroupIndex } = get();
    if (!definition) return;

    if (currentGroupIndex < definition.groups.length - 1) {
      set({ currentGroupIndex: currentGroupIndex + 1 });
    }
  },

  prevGroup: () => {
    const { currentGroupIndex } = get();
    if (currentGroupIndex > 0) {
      set({ currentGroupIndex: currentGroupIndex - 1 });
    }
  },

  goToGroup: (index) => {
    const { definition } = get();
    if (!definition) return;

    if (index >= 0 && index < definition.groups.length) {
      set({ currentGroupIndex: index });
    }
  },

  // Validation
  validateField: (component) => {
    const { values, uploadedFiles } = get();
    const value = values[component.key];

    // Required check
    if (component.required) {
      if (component.controlType === 'upload') {
        const files = uploadedFiles[component.key] || [];
        if (files.length === 0) {
          return component.validation?.find(v => v.type === 'required')?.message.de
            || 'Dieses Feld ist erforderlich';
        }
      } else if (component.controlType === 'checkbox') {
        if (value !== true) {
          return component.validation?.find(v => v.type === 'required')?.message.de
            || 'Diese Bestätigung ist erforderlich';
        }
      } else if (value === undefined || value === null || value === '') {
        return component.validation?.find(v => v.type === 'required')?.message.de
          || 'Dieses Feld ist erforderlich';
      }
    }

    // Additional validation rules
    if (component.validation) {
      for (const rule of component.validation) {
        if (rule.type === 'required') continue; // Already handled

        const strValue = String(value || '');

        switch (rule.type) {
          case 'minLength':
            if (strValue.length < Number(rule.value)) {
              return rule.message.de;
            }
            break;
          case 'maxLength':
            if (strValue.length > Number(rule.value)) {
              return rule.message.de;
            }
            break;
          case 'pattern':
            if (rule.value && !new RegExp(String(rule.value)).test(strValue)) {
              return rule.message.de;
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
              return rule.message.de;
            }
            break;
          case 'min':
            if (Number(value) < Number(rule.value)) {
              return rule.message.de;
            }
            break;
          case 'max':
            if (Number(value) > Number(rule.value)) {
              return rule.message.de;
            }
            break;
        }
      }
    }

    return null;
  },

  validateGroup: (groupIndex) => {
    const { definition, values } = get();
    if (!definition || !definition.groups[groupIndex]) {
      return { valid: true, errors: {}, warnings: [] };
    }

    const group = definition.groups[groupIndex];
    const errors: FormErrors = {};
    const warnings: string[] = [];

    group.components.forEach(component => {
      // Check conditional display
      if (component.conditionalDisplay) {
        const dependsOnValue = values[component.conditionalDisplay.dependsOn];
        const condition = component.conditionalDisplay.condition;
        const targetValue = component.conditionalDisplay.value;

        let shouldDisplay = false;
        switch (condition) {
          case 'equals':
            shouldDisplay = dependsOnValue === targetValue;
            break;
          case 'notEquals':
            shouldDisplay = dependsOnValue !== targetValue;
            break;
          case 'contains':
            shouldDisplay = Array.isArray(dependsOnValue)
              ? dependsOnValue.includes(targetValue)
              : String(dependsOnValue).includes(String(targetValue));
            break;
          case 'isEmpty':
            shouldDisplay = !dependsOnValue;
            break;
          case 'isNotEmpty':
            shouldDisplay = !!dependsOnValue;
            break;
        }

        if (!shouldDisplay) return; // Skip validation for hidden fields
      }

      const error = get().validateField(component);
      if (error) {
        errors[component.key] = error;
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  },

  validateAll: () => {
    const { definition } = get();
    if (!definition) {
      return { valid: true, errors: {}, warnings: [] };
    }

    let allErrors: FormErrors = {};
    const allWarnings: string[] = [];

    definition.groups.forEach((_, index) => {
      const result = get().validateGroup(index);
      allErrors = { ...allErrors, ...result.errors };
      allWarnings.push(...result.warnings);
    });

    return {
      valid: Object.keys(allErrors).length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  },

  // Computed
  isGroupValid: (groupIndex) => {
    return get().validateGroup(groupIndex).valid;
  },

  canProceed: () => {
    const { currentGroupIndex } = get();
    return get().isGroupValid(currentGroupIndex);
  },

  getProgress: () => {
    const { definition, currentGroupIndex } = get();
    if (!definition || definition.groups.length === 0) return 0;
    return ((currentGroupIndex + 1) / definition.groups.length) * 100;
  },

  // Reset
  reset: () => {
    set(initialState);
  }
}));
