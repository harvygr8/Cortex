'use client';

import { Loader2 } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function Loader({ text }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative">
        <Loader2 className={`w-12 h-12 animate-spin ${theme.text}`} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-lg font-medium font-ibm-plex-sans ${theme.text}`}>
          {text}
        </span>
        <span className={`text-sm ${theme.secondary}`}>
          This may take a few moments
        </span>
      </div>
    </div>
  );
} 