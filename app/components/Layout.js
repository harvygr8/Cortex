'use client';

import Navbar from './Navbar';
import useThemeStore from '../../lib/stores/themeStore';

export default function Layout({ children }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <div className={`min-h-screen ${theme.background}`}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 