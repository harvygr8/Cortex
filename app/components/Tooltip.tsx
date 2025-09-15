'use client';

import { useState, ReactNode } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export default function Tooltip({ children, content, position = 'right', className = '' }: TooltipProps) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2';
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
      default:
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute ${getPositionClasses()} px-2 py-1 text-xs font-medium ${theme.button} text-white rounded shadow-lg border ${theme.border} whitespace-nowrap z-50`}>
          {content}
        </div>
      )}
    </div>
  );
}
