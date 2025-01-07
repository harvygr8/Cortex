'use client';

import Link from 'next/link';
import useThemeStore from '../../lib/stores/themeStore';

export default function ProjectGrid({ projects }) {
  const { isDarkMode, theme } = useThemeStore();

  if (!projects.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${isDarkMode ? theme.dark.background : theme.light.background}`}>
        <h3 className={`text-xl font-semibold font-figtree ${isDarkMode ? theme.dark.text : theme.light.text}`}>
          Welcome to Cortex!
        </h3>
        <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
          Create your first project to start organizing your knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <div className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${
            isDarkMode 
              ? `${theme.dark.background2}` 
              : `${theme.light.background2} shadow-md`
          }`}>
            <div className="flex justify-between items-start">
              <h3 className={`text-xl font-semibold font-figtree ${isDarkMode ? theme.dark.text : theme.light.text}`}>
                {project.title}
              </h3>
              <span className={`text-sm ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
                {project.pages?.length || 0} pages
              </span>
            </div>
            {project.description && (
              <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary} line-clamp-2`}>
                {project.description}
              </p>
            )}
            <p className={`text-sm mt-4 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
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
        </Link>
      ))}
    </div>
  );
} 