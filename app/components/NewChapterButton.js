'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function NewChapterButton({ projectId, onChapterCreated }) {
  const { isDarkMode, theme } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chapter');
      }
      
      setIsModalOpen(false);
      setTitle('');
      onChapterCreated();
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Failed to create chapter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2 rounded-lg ${isDarkMode ? theme.dark.primary : theme.light.primary} ${isDarkMode ? theme.dark.hover.primary : theme.light.hover.primary}`}
      >
        New Chapter
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Chapter</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg disabled:opacity-50 ${isDarkMode ? theme.dark.primary : theme.light.primary} ${isDarkMode ? theme.dark.hover.primary : theme.light.hover.primary}`}
                >
                  {saving ? 'Creating...' : 'Create Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 