import type { StatusAction } from '../types';

export const TIMELINE_STEPS = [
  { id: 1, label: 'Eingang', status: 'eingang' },
  { id: 2, label: 'Beim NB', status: 'beim_nb' },
  { id: 3, label: 'Genehmigt', status: 'genehmigt' },
  { id: 4, label: 'IBN', status: 'ibn' },
  { id: 5, label: 'Fertig', status: 'fertig' },
];

export function getStepState(stepStatus: string, currentStatus: string): 'done' | 'active' | 'pending' {
  const stepOrder = ['eingang', 'beim_nb', 'genehmigt', 'ibn', 'fertig'];
  const normalizedStatus = currentStatus?.toLowerCase().replace(/_/g, '_') || 'eingang';
  const stepIndex = stepOrder.indexOf(stepStatus);
  const currentIndex = stepOrder.indexOf(normalizedStatus);
  if (currentIndex === -1) {
    return stepIndex === 0 ? 'active' : 'pending';
  }
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

export function getProgressWidth(status: string): string {
  const stepOrder = ['eingang', 'beim_nb', 'genehmigt', 'ibn', 'fertig'];
  const normalizedStatus = status?.toLowerCase() || 'eingang';
  const currentIndex = stepOrder.indexOf(normalizedStatus);
  if (currentIndex <= 0) return '0%';
  return `${(currentIndex / (stepOrder.length - 1)) * 100}%`;
}

export function getStatusActions(currentStatus: string): StatusAction[] {
  const status = currentStatus?.toLowerCase() || 'eingang';
  switch (status) {
    case 'eingang':
      return [
        { label: 'Beim NB eingereicht', targetStatus: 'beim_nb', variant: 'primary', icon: 'check' },
        { label: 'Stornieren', targetStatus: 'storniert', variant: 'danger', icon: 'alert' },
      ];
    case 'beim_nb':
      return [
        { label: 'Genehmigung erhalten', targetStatus: 'genehmigt', variant: 'primary', icon: 'check' },
        { label: 'Rückfrage', targetStatus: 'rueckfrage', variant: 'danger', icon: 'alert' },
        { label: 'Zurück', targetStatus: 'eingang', variant: 'secondary', icon: 'arrow' },
      ];
    case 'rueckfrage':
      return [
        { label: 'Rückfrage beantwortet', targetStatus: 'beim_nb', variant: 'primary', icon: 'check' },
        { label: 'Genehmigung erhalten', targetStatus: 'genehmigt', variant: 'primary', icon: 'check' },
      ];
    case 'genehmigt':
      return [
        { label: 'IBN durchgeführt', targetStatus: 'ibn', variant: 'primary', icon: 'check' },
        { label: 'Zurück zu Beim NB', targetStatus: 'beim_nb', variant: 'secondary', icon: 'arrow' },
      ];
    case 'ibn':
      return [
        { label: 'Fertig melden', targetStatus: 'fertig', variant: 'primary', icon: 'check' },
        { label: 'Zurück', targetStatus: 'genehmigt', variant: 'secondary', icon: 'arrow' },
      ];
    case 'fertig':
      return [
        { label: 'Abrechnen', targetStatus: 'abgerechnet', variant: 'primary', icon: 'check' },
      ];
    case 'abgerechnet':
    case 'storniert':
      return [];
    default:
      return [
        { label: 'Genehmigung erhalten', targetStatus: 'genehmigt', variant: 'primary', icon: 'check' },
      ];
  }
}
