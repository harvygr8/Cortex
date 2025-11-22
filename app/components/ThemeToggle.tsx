'use client';

import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDarkMode ? "Switch to light mode" : "Switch to dark mode"}</p>
      </TooltipContent>
    </Tooltip>
  );
} 