'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

interface MarkdownPreviewProps {
  content: string;
  isEditing: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function MarkdownPreview({ content, isEditing, onSave, onCancel }: MarkdownPreviewProps) {
  const [editedContent, setEditedContent] = useState(content);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleSave = () => {
    onSave(editedContent);
  };

  const handleCancel = () => {
    setEditedContent(content);
    onCancel();
  };

  const parseMarkdown = (text: string) => {
    if (!text) return '';
    
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold font-ibm-plex-sans mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold font-ibm-plex-sans mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold font-ibm-plex-sans mt-8 mb-4">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">$1</code>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc my-2">$1</ul>')
      
      // Numbered lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ol class="list-decimal my-2">$1</ol>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags
      .replace(/^(.+)$/gm, '<p class="my-2">$1</p>')
      .replace(/<p class="my-2"><\/p>/g, '')
      .replace(/<p class="my-2"><br><\/p>/g, '');
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className={`w-full h-[40rem] p-4 rounded-lg border resize-none ${theme.input}`}
          placeholder="Write your content here..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded ${theme.button}`}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className={`px-4 py-2 rounded ${theme.button}`}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`prose max-w-none ${theme.text}`}>
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    </div>
  );
} 