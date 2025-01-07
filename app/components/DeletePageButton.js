'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';
import { FaTrash } from 'react-icons/fa';

export default function DeletePageButton({ pageId, projectId, onPageDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDarkMode, theme } = useThemeStore();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    setIsDeleting(true);
    try {
      await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'DELETE',
      });
      onPageDeleted();
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
      className={`flex items-center gap-2 text-sm px-3 py-1 rounded-lg transition-colors font-figtree ${
        isDarkMode 
          ? '' 
          : ''
      }`}
      title="Delete Page"
    >
      <FaTrash className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
      <span className="sr-only">Delete Page</span>
    </button>
  );
} 