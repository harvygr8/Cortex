'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function MarkdownPreview({ content, onChange }) {
  const [isPreview, setIsPreview] = useState(false);
  const { isDarkMode, theme } = useThemeStore();

  // Simple markdown parsing (you might want to use a proper markdown library)
  const parseMarkdown = (text) => {
    return text
      .replace(/#{3} (.*)/g, '<h3>$1</h3>')
      .replace(/#{2} (.*)/g, '<h2>$1</h2>')
      .replace(/#{1} (.*)/g, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 rounded-lg text-sm ${
            isDarkMode ? theme.dark.secondary : theme.light.secondary
          }`}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      
      {isPreview ? (
        <div
          className={`prose ${isDarkMode ? 'prose-invert' : ''} max-w-none`}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
      ) : (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent focus:outline-none ${
            isDarkMode ? theme.dark.text : theme.light.text
          }`}
          rows={20}
        />
      )}
    </div>
  );
} 