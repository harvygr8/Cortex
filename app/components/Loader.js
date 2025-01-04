'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function Loader({ text }) {
  const { isDarkMode, theme } = useThemeStore();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-stone-200 dark:border-stone-700"></div>
        <div className="w-12 h-12 rounded-full border-4 border-t-amber-500 animate-spin absolute top-0 left-0"></div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-lg font-medium ${isDarkMode ? theme.dark.text : theme.light.text}`}>
          {text}
        </span>
        <span className={`text-sm ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
          This may take a few moments...
        </span>
      </div>
    </div>
  );
} 