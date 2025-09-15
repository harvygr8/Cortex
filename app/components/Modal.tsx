'use client';

import { X } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center`}>
      <div className={`${theme.modal.background} ${theme.modal.text} rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl relative`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${theme.secondary} hover:${theme.text} z-10`}
        >
          <X className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
} 