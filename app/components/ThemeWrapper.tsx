'use client';

import { useEffect, useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function ThemeWrapper({ children }) {
  const [isClient, setIsClient] = useState(false);
  const { isDarkMode, colors } = useThemeStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render theme-dependent content until client-side
  if (!isClient) {
    return <div className="min-h-screen">{children}</div>;
  }

  const currentTheme = isDarkMode ? colors.dark : colors.light;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${currentTheme.background} ${currentTheme.text}`}>
      {children}
    </div>
  );
} 