'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function PageLoader() {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
      <div className="relative">
        <div className={`w-8 h-8 rounded-full border-4 ${theme.border}`}></div>
        <div className={`w-8 h-8 rounded-full border-4 border-t-current animate-spin absolute top-0 left-0 ${theme.text}`}></div>
      </div>
    </div>
  );
}
