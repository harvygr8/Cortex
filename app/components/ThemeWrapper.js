'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function ThemeWrapper({ children }) {
  const { isDarkMode, theme } = useThemeStore();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? `${theme.dark.background} ${theme.dark.text}` 
        : `${theme.light.background} ${theme.light.text}`
    }`}>
      {children}
    </div>
  );
} 