'use client';

import Link from 'next/link';
import useThemeStore from '../../lib/stores/themeStore';

export default function PageList({ pages, projectId }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  if (!pages.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${theme.background2}`}>
        <h3 className={`text-xl font-semibold font-source-sans-3 ${theme.text}`}>
          No pages yet
        </h3>
        <p className={`mt-2 ${theme.secondary}`}>
          Create your first page to start building your knowledge base.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pages.map((page) => (
        <Link key={page.id} href={`/projects/${projectId}/pages/${page.id}`}>
          <div className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1 h-48 flex flex-col ${
            isDarkMode
              ? `${theme.background2} border border-gray-700`
              : `${theme.background2} shadow-md`
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-xl font-semibold font-source-sans-3 line-clamp-1 ${theme.text}`}>
                {page.title}
              </h3>
            </div>
            <div className="flex-1">
              {page.content && (
                <p className={`text-sm line-clamp-3 ${theme.secondary}`}>
                  {page.content}
                </p>
              )}
            </div>
            <div className="mt-auto pt-4">
              <p className={`text-xs ${theme.secondary}`}>
                {page.created_at
                  ? new Date(page.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Recently created'
                }
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 