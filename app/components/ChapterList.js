'use client';

import { useState } from 'react';
import Link from 'next/link';
import useThemeStore from '../../lib/stores/themeStore';

export default function ChapterList({ chapters, projectId, pageId }) {
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const toggleChapter = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  if (!chapters.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${theme.background2}`}>
        <h3 className={`text-xl font-semibold font-source-sans-3 ${theme.text}`}>
          No chapters yet
        </h3>
        <p className={`mt-2 ${theme.secondary}`}>
          Create your first chapter to start organizing your content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {chapters.map((chapter) => (
        <div key={chapter.id} className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-48 flex flex-col ${
          isDarkMode
            ? `${theme.background2} border border-gray-700`
            : `${theme.background2} shadow-md`
        }`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className={`text-xl font-semibold font-source-sans-3 line-clamp-1 ${theme.text}`}>
              {chapter.title}
            </h3>
          </div>
          <div className="flex-1">
            {chapter.content && (
              <p className={`text-sm line-clamp-3 ${theme.secondary}`}>
                {chapter.content}
              </p>
            )}
          </div>
          <div className="mt-auto pt-4">
            <p className={`text-xs ${theme.secondary}`}>
              {chapter.created_at
                ? new Date(chapter.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Recently created'
              }
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 