'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';

export default function NewProjectButton({ onProjectCreated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { isDarkMode, theme } = useThemeStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const project = await response.json();
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      onProjectCreated();
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
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
        New Project
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? theme.dark.background2 : theme.light.background2}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? theme.dark.text : theme.light.text}`}>Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : ''}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : ''}`}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 text-gray-600 hover:text-gray-800 ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : ''}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 border-slate-600' : ''}`}
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 