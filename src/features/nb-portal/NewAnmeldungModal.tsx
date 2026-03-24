// src/features/nb-portal/NewAnmeldungModal.tsx
/**
 * New Registration Modal
 * ======================
 * Navigiert direkt zum Standard-Wizard
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NewAnmeldungModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAnmeldungModal({ isOpen, onClose }: NewAnmeldungModalProps) {
  const navigate = useNavigate();

  // Direkt zum Wizard navigieren wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      onClose();
      navigate('/anlagen-wizard');
    }
  }, [isOpen, navigate, onClose]);

  // Kein UI - navigiert direkt
  return null;
}

export default NewAnmeldungModal;
