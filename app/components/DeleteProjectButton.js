'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';
import { FaTrash } from 'react-icons/fa';

export default function DeleteProjectButton({ projectId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDarkMode, theme } = useThemeStore();
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project and all its pages?')) return;
    
    setIsDeleting(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      router.push('/');
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`flex items-center gap-2 text-sm px-3 py-1 rounded-lg transition-colors ${
        isDarkMode 
          ? '' 
          : ''
      }`}
      title="Delete Project"
    >
      <FaTrash className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
      <span className="sr-only">Delete Project</span>
    </button>
  );
} 