'use client';

import { FileText } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function SourceBadge({ source }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  if (!source) return null;

  // Handle both string and object sources
  const sourceText = typeof source === 'string' ? source : source.title || 'Unknown source';

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${theme.border} ${theme.background}`}>
      <FileText className="w-3 h-3 mr-1.5" />
      {sourceText}
    </div>
  );
} 