export { useProduktDB } from './useProduktDB';
export { usePLZ, usePLZCallback } from './usePLZ';

// Learning System
export {
  useLearning,
  useSuggestions,
  useRegionalData,
  usePatternAnalysis,
  type UseLearningResult
} from './useLearning';

// Validation System
export {
  useStepValidation,
  useFieldError,
  useWizardValidation,
  useTouchedFields,
  useCanProceed,
  type FieldError,
  type StepValidation,
} from './useValidation';

// Document Management with IndexedDB
export { useDocuments } from './useDocuments';
