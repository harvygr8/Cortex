'use client';
import React from 'react';

import { useEffect } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    // Sync Zustand store with the theme that was set by the script in layout.tsx
    // This ensures the store state matches the actual DOM state
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {children}
    </div>
  );
} 