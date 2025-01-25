'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import useThemeStore from '../../lib/stores/themeStore';

export default function MarkdownPreview({ content, onChange, isPreview }) {
  const { isDarkMode, theme } = useThemeStore();

  return (
    <div className="h-[calc(100vh-24rem)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {isPreview ? (
          <div className={`prose ${isDarkMode ? 'prose-invert' : ''} max-w-none`}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
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