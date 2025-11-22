import { create } from 'zustand';

interface ThemeStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

const useThemeStore = create<ThemeStore>((set, get) => ({
  isDarkMode: false,
  initializeTheme: () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // Sync with the theme that was already set by the script in layout.tsx
    // The script runs before React hydrates, so we just read the current state
    const isDark = document.documentElement.classList.contains('dark');
    set({ isDarkMode: isDark });
  },
  toggleTheme: () => set((state: ThemeStore) => {
    const newIsDarkMode = !state.isDarkMode;
    
    // Update the document class for Tailwind dark mode (shadCN uses class-based dark mode)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (newIsDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
    
    return { isDarkMode: newIsDarkMode };
  }),
}));

export default useThemeStore; 