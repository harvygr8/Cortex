'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function DeletePageButton({ pageId, projectId, onPageDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onPageDeleted();
      } else {
        console.error('Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`p-3 rounded-lg shadow-lg ${theme.button} hover:opacity-80 transition-opacity disabled:opacity-50 backdrop-blur-sm`}
      title="Delete Page"
    >
      {isDeleting ? (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
} 