'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search projects..."
        className={`w-full p-3 border rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
      />
    </form>
  );
} 