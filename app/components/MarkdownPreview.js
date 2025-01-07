'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function MarkdownPreview({ content, onChange, isPreview }) {
  const { isDarkMode, theme } = useThemeStore();

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
    <div className="h-[calc(100vh-24rem)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {isPreview ? (
          <div
            className={`prose ${isDarkMode ? 'prose-invert' : ''} max-w-none`}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-full resize-none bg-transparent focus:outline-none ${
              isDarkMode ? theme.dark.text : theme.light.text
            }`}
          />
        )}
      </div>
    </div>
  );
} 