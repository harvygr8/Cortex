'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function Modal({ isOpen, onClose, children }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className={`${theme.modal.background} ${theme.modal.text} rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl relative`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${theme.secondary} hover:${theme.text} z-10`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
} 