'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Plus } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Tooltip from './Tooltip';
import useThemeStore from '../../lib/stores/themeStore';
import useProjectStore from '../../lib/stores/projectStore';

export default function Sidebar() {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const pathname = usePathname();
  const activeProjectId = useProjectStore(state => state.activeProjectId);

  return (
    <div className={`fixed left-0 top-0 h-full w-20 ${theme.sidebar} border-r ${theme.border} flex flex-col items-center py-6 z-50`}>
      <div className="mb-8">
        <Tooltip content="Home">
          <Link 
            href="/" 
            className={`flex items-center justify-center w-12 h-12 ${theme.sidebarLogo} rounded-lg transition-colors hover:opacity-80`}
          >
            <Brain className="w-7 h-7" />
          </Link>
        </Tooltip>
      </div>
      
      <div className="flex-1 flex flex-col items-center space-y-4">
        <Tooltip content="New Project">
          <button 
            onClick={() => {
              if (window.openNewProjectModal) {
                window.openNewProjectModal();
              }
            }}
            className={`p-3 ${theme.sidebarIcon} transition-colors`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </Tooltip>
      </div>
      
      <div className="mb-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
