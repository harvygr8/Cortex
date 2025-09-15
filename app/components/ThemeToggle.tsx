'use client';

import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function ThemeToggle() {
  const { isDarkMode, colors, toggleTheme } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md ${theme.text} ${theme.hover}`}
    >
      {isDarkMode ? (
        <Sun className={`w-5 h-5 ${theme.text}`} />
      ) : (
        <Moon className={`w-5 h-5 ${theme.text}`} />
      )}
    </button>
  );
} 