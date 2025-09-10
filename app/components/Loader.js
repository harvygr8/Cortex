'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function Loader({ text }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-stone-200 dark:border-stone-700"></div>
        <div className={`w-12 h-12 rounded-full border-4 border-t-current animate-spin absolute top-0 left-0 ${theme.text}`}></div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-lg font-medium font-source-sans-3 ${theme.text}`}>
          {text}
        </span>
        <span className={`text-sm ${theme.secondary}`}>
          This may take a few moments
        </span>
      </div>
    </div>
  );
} 