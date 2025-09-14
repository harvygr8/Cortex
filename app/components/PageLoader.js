'use client';

import { Loader2 } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function PageLoader() {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
      <div className="relative">
        <Loader2 className={`w-8 h-8 animate-spin ${theme.text}`} />
      </div>
    </div>
  );
}
