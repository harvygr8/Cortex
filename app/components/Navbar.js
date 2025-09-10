'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';
import useProjectStore from '../../lib/stores/projectStore';
import { getHeadingClasses } from '../../lib/utils/fontUtils';

export default function Navbar() {
  const pathname = usePathname();
  const { isDarkMode, colors, fonts, toggleTheme } = useThemeStore();
  const activeProjectId = useProjectStore(state => state.activeProjectId);
  const theme = isDarkMode ? colors.dark : colors.light;

  const navClasses = theme.navbar;

  const linkClasses = (isActive) => {
    const baseClasses = 'px-3 py-2 rounded-md flex items-center gap-2 relative group';
    if (isActive) {
      return `${baseClasses} ${theme.primary}`;
    }
    return `${baseClasses} ${theme.text} ${theme.hoverPrimary}`;
  };

  return (
    <nav className={`${navClasses} shadow-md`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className={`${getHeadingClasses('logo')} ${theme.accent} flex items-center gap-2`}>
            <span className="material-symbols-outlined" style={{ fontSize: '34px' }}>
              network_intel_node
            </span>
            Cortex
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={linkClasses(pathname === '/')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                folder
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                Projects
              </span>
            </Link>
            {activeProjectId && (
              <Link
                href="/chat"
                className={linkClasses(pathname === '/chat')}
              >
                <span className="material-symbols-outlined text-[24px]">
                  forum
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                  Chat
                </span>
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className={`${linkClasses(false)} p-2`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 