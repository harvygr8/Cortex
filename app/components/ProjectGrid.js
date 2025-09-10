'use client';

import Link from 'next/link';
import useThemeStore from '../../lib/stores/themeStore';

export default function ProjectGrid({ projects }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  if (!projects.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${theme.background2}`}>
        <h3 className={`text-xl font-semibold font-source-sans-3 ${theme.text}`}>
          Welcome to Cortex!
        </h3>
        <p className={`mt-2 ${theme.secondary}`}>
          Create your first project to start organizing your knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <div className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1 h-48 flex flex-col ${
            theme.background2
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-xl font-semibold font-source-sans-3 line-clamp-1 ${theme.text}`}>
                {project.title}
              </h3>
              <span className={`text-sm whitespace-nowrap ml-2 ${theme.secondary} flex items-center gap-1`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {project.pages?.length || 0}
              </span>
            </div>
            <div className="flex-1">
              {project.description && (
                <p className={`text-sm line-clamp-3 ${theme.secondary}`}>
                  {project.description}
                </p>
              )}
            </div>
            <div className="mt-auto pt-4">
              <p className={`text-xs ${theme.secondary}`}>
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString('en-US', {
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