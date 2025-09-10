'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import useThemeStore from '../../lib/stores/themeStore';
import useProjectStore from '../../lib/stores/projectStore';

export default function Sidebar() {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const pathname = usePathname();
  const activeProjectId = useProjectStore(state => state.activeProjectId);
  
  // Show chat icon only when a project is selected or we're in a project page view
  const shouldShowChatIcon = activeProjectId || pathname.startsWith('/projects/');

  return (
    <div className={`fixed left-0 top-0 h-full w-20 ${theme.sidebar} border-r ${theme.border} flex flex-col items-center py-6 z-50`}>
      <div className="mb-8">
        <Link href="/" className={`flex items-center justify-center w-12 h-12 ${theme.sidebarLogo} rounded-lg transition-colors hover:opacity-80`}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col items-center space-y-4">
        <Link href="/" className={`p-3 ${theme.sidebarIcon} transition-colors`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </Link>
        
        <button 
          onClick={() => {
            if (window.openNewProjectModal) {
              window.openNewProjectModal();
            }
          }}
          className={`p-3 ${theme.sidebarIcon} transition-colors`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        {shouldShowChatIcon && (
          <Link href="/chat" className={`p-3 ${theme.sidebarIcon} transition-colors`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>
        )}
      </div>
      
      <div className="mb-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
