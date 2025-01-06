'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function SourceBadge({ title, relevance }) {
  const { isDarkMode, theme } = useThemeStore();
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
      isDarkMode ? theme.dark.background2 : theme.light.background2
    } border ${isDarkMode ? 'border-stone-700' : 'border-stone-200'}`}>
      <span className="text-white">{title}</span>
    </div>
  );
} 