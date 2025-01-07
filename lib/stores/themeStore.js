import { create } from 'zustand';
import theme from '../theme';

const useThemeStore = create((set) => ({
  isDarkMode: true,
  theme: theme,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

export default useThemeStore; 