'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';
import { getHeadingClasses, getLabelClasses } from '../../lib/utils/fontUtils';

export default function NewNoteForm({ onNoteCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const { isDarkMode, colors, fonts } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();
      onNoteCreated(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className={`${getHeadingClasses('h1')} mb-2 ${theme.text}`}>
          Create New Project
        </h1>
        <p className={`${theme.secondary}`}>
          Start organizing your knowledge with a new project.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block ${getLabelClasses()} ${theme.text} mb-2`}>
            Project Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="Enter project title..."
            required
          />
        </div>

        <div>
          <label className={`block ${getLabelClasses()} ${theme.text} mb-2`}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border resize-none ${theme.input} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="Describe what this project is about..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${theme.button} hover:opacity-80 transition-opacity disabled:opacity-50`}
        >
          {saving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </>
          )}
        </button>
      </div>
    </form>
  );
} 