'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function SourceBadge({ source }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  if (!source) return null;

  // Handle both string and object sources
  const sourceText = typeof source === 'string' ? source : source.title || 'Unknown source';

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${theme.border} ${theme.background}`}>
      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {sourceText}
    </div>
  );
} 