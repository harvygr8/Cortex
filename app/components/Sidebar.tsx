'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Plus, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useProjectStore from '../../lib/stores/projectStore';

export default function Sidebar() {
  const pathname = usePathname();
  const activeProjectId = useProjectStore(state => state.activeProjectId);

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-card border-r border-border flex flex-col items-center py-3 z-50">
      <div className="mb-4 flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              href="/" 
              className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg transition-colors hover:bg-primary/90 mb-2"
            >
              <Brain className="w-7 h-7" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Home</p>
          </TooltipContent>
        </Tooltip>
        <div className="text-xs font-semibold text-foreground text-center">
          Cortex
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center space-y-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.openNewProjectModal) {
                  window.openNewProjectModal();
                }
              }}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Project</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-spotlight'));
              }}
            >
              <Search className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search Canvas</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/settings">
              <Button
                variant={pathname === '/settings' ? 'default' : 'ghost'}
                size="icon"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    
      <div className="mb-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
