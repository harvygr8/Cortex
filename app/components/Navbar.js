'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';
import useProjectStore from '../../lib/stores/projectStore';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const { isDarkMode, theme } = useThemeStore();
  const activeProjectId = useProjectStore(state => state.activeProjectId);

  const navClasses = isDarkMode 
    ? theme.dark.background
    : theme.light.background;

  const linkClasses = (isActive) => {
    const baseClasses = 'px-3 py-2 rounded-md';
    if (isDarkMode) {
      return isActive
        ? `${baseClasses} ${theme.dark.primary}`
        : `${baseClasses} ${theme.dark.text} ${theme.dark.hover.primary}`;
    }
    return isActive
      ? `${baseClasses} ${theme.light.primary}`
      : `${baseClasses} ${theme.light.text} ${theme.light.hover.primary}`;
  };

  return (
    <nav className={`${navClasses} shadow-md`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className={`text-xl font-bold ${isDarkMode ? theme.dark.accent : theme.light.accent}`}>
            Cortex
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={linkClasses(pathname === '/')}
            >
              Projects
            </Link>
            {activeProjectId && (
              <Link
                href="/chat"
                className={linkClasses(pathname === '/chat')}
              >
                Chat
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
} 