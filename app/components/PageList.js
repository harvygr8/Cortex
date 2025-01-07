'use client';

import Link from 'next/link';
import useThemeStore from '../../lib/stores/themeStore';
import DeletePageButton from './DeletePageButton';

export default function PageList({ pages, projectId }) {
  const { isDarkMode, theme } = useThemeStore();

  if (!pages.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${isDarkMode ? theme.dark.background : theme.light.background}`}>
        <h3 className={`text-xl font-semibold font-figtree ${isDarkMode ? theme.dark.text : theme.light.text}`}>
          No pages yet
        </h3>
        <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
          Start by adding your first page.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pages.map((page) => (
        <div key={page.id} 
          className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative ${
            isDarkMode ? theme.dark.background2 : theme.light.background2
          }`}
        >
          <div className="absolute top-6 right-6 z-10">
            <DeletePageButton 
              pageId={page.id} 
              projectId={projectId}
              onPageDeleted={() => window.location.reload()}
            />
          </div>
          <Link 
            href={`/projects/${projectId}/pages/${page.id}`}
            className="block cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <span className={`text-lg font-medium font-figtree ${
                isDarkMode ? theme.dark.text : theme.light.text
              }`}>
                {page.title}
              </span>
              <div className="w-8" /> {/* Spacer for delete button */}
            </div>
            {page.content && (
              <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary} line-clamp-3`}>
                {page.content}
              </p>
            )}
          </Link>
        </div>
      ))}
    </div>
  );
} 