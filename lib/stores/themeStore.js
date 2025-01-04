import { create } from 'zustand';
import theme from '../theme';

const useThemeStore = create((set) => ({
  isDarkMode: false,
  theme: theme,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

export default useThemeStore; 