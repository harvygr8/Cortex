'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
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
      className={`p-3 rounded-lg ${theme.button} hover:opacity-80 transition-opacity disabled:opacity-50 w-11 h-11 flex items-center justify-center`}
      title="Delete Page"
    >
      {isDeleting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Trash2 className="w-5 h-5" />
      )}
    </button>
  );
} 