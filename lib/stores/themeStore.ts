import { create } from 'zustand';
import { colors } from '../colors';

interface ThemeStore {
  isDarkMode: boolean;
  colors: typeof colors;
  fonts: any;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeStore>((set) => ({
  isDarkMode: false,
  colors: colors,
  // Font configuration - accessible via theme.font
  fonts: colors.light.font, // Default to light mode fonts
  toggleTheme: () => set((state: ThemeStore) => {
    const newIsDarkMode = !state.isDarkMode;
    // Update the document class for Tailwind dark mode
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (newIsDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { 
      isDarkMode: newIsDarkMode,
      fonts: newIsDarkMode ? colors.dark.font : colors.light.font
    };
  }),
}));

// Initialize light mode on page load (client-side only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
}

export default useThemeStore; 