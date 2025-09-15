'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import Modal from './Modal';
import useThemeStore from '../../lib/stores/themeStore';
import { getHeadingClasses, getLabelClasses } from '../../lib/utils/fontUtils';

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }) {
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
      
      // Reset form
      setTitle('');
      setDescription('');
      
      // Call the callback to refresh projects list
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle('');
    setDescription('');
    setSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
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
              autoFocus
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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={`px-6 py-3 rounded-lg border ${theme.border} ${theme.secondary} hover:opacity-80 transition-opacity disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 ${theme.button} hover:opacity-80 transition-opacity disabled:opacity-50`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
