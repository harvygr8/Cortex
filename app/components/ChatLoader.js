'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function ChatLoader() {
  const { isDarkMode, theme } = useThemeStore();
  
  return (
    <div className="flex items-start space-x-2 p-4">
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isDarkMode ? theme.dark.background : theme.light.background
      }`}>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isDarkMode ? theme.dark.primary : theme.light.primary} animate-bounce [animation-delay:-0.3s]`}></div>
          <div className={`w-2 h-2 rounded-full ${isDarkMode ? theme.dark.primary : theme.light.primary} animate-bounce [animation-delay:-0.15s]`}></div>
          <div className={`w-2 h-2 rounded-full ${isDarkMode ? theme.dark.primary : theme.light.primary} animate-bounce`}></div>
        </div>
      </div>
    </div>
  );
} 