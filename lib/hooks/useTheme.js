import { useCallback } from 'react';
import useThemeStore from '../stores/themeStore';
import theme from '../config/theme';

export default function useTheme() {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  
  const getColor = useCallback((category, variant) => {
    const mode = isDarkMode ? theme.dark : theme.light;
    return mode[category][variant];
  }, [isDarkMode]);

  return {
    isDarkMode,
    getColor
  };
}