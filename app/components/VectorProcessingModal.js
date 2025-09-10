'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function VectorProcessingModal({ 
  isOpen, 
  onClose, 
  message = "Processing your content..."
}) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-sm mx-4 p-8 rounded-lg shadow-xl ${theme.background} border ${theme.border}`}>
        {/* Content */}
        <div className="flex flex-col items-center space-y-4">
          {/* Loader */}
          <div className="relative">
            <svg className={`w-12 h-12 animate-spin ${theme.text}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          {/* Message */}
          <p className={`text-center ${theme.text}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
