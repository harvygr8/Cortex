'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function NewPageButton({ projectId, onPageCreated }) {
  const { isDarkMode, theme } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create page');
      }
      
      setIsModalOpen(false);
      setTitle('');
      onPageCreated();
    } catch (error) {
      console.error('Error creating page:', error);
      alert('Failed to create page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2 rounded-lg ${isDarkMode ? theme.dark.primary : theme.light.primary}`}
      >
        New Page
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? theme.dark.background2 : theme.light.background2}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? theme.dark.text : theme.light.text}`}>
              Create New Page
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 ${
                    isDarkMode ? 'bg-slate-700 border-slate-600' : ''
                  }`}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? theme.dark.primary : theme.light.primary}`}
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 