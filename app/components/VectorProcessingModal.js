'use client';

import { Loader2 } from 'lucide-react';
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
        className={`absolute inset-0 ${theme.overlay}`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-sm mx-4 p-8 rounded-lg shadow-xl ${theme.background} border ${theme.border}`}>
        {/* Content */}
        <div className="flex flex-col items-center space-y-4">
          {/* Loader */}
          <div className="relative">
            <Loader2 className={`w-12 h-12 animate-spin ${theme.text}`} />
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
