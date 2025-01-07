'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';

export default function NewProjectButton({ onProjectCreated }) {
  const { isDarkMode, theme } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      onProjectCreated();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          isDarkMode 
            ? `${theme.dark.primary} hover:bg-opacity-80` 
            : `${theme.light.primary} hover:bg-opacity-80`
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          add_circle
        </span>
        New Project
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? theme.dark.background2 : theme.light.background2}`}>
            <h2 className={`text-2xl font-bold font-figtree mb-4 ${isDarkMode ? theme.dark.text : theme.light.text}`}>
              Create New Project
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
                    isDarkMode ? 'bg-neutral-700 border-neutral-600 text-white' : ''
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 ${
                    isDarkMode ? 'bg-neutral-700 border-neutral-600 text-white' : ''
                  }`}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? `${theme.dark.text} hover:${theme.dark.hover.secondary}` 
                      : `${theme.light.text} hover:${theme.light.hover.secondary}`
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isDarkMode 
                      ? `${theme.dark.primary} hover:bg-opacity-80` 
                      : `${theme.light.primary} hover:bg-opacity-80`
                  }`}
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        progress_activity
                      </span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        add_circle
                      </span>
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 