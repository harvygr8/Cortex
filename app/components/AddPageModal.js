'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function AddPageModal({ project, isOpen, onClose, onSubmit }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        projectId: project.id
      });
      
      // Reset form
      setFormData({ title: '', content: '' });
      onClose();
    } catch (error) {
      console.error('Error creating page:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`
        ${theme.modal?.background || theme.background2} rounded-lg shadow-xl ${theme.border}
        w-full max-w-md mx-4
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <h2 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} ${theme.modal?.text || theme.text} flex items-center gap-2`}>
            <Plus className={`w-4 h-4 ${theme.accent}`} />
            Add Page to {project.title}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded ${theme.hover} transition-colors`}
          >
            <X className={`w-4 h-4 ${theme.secondary}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.font?.label || 'font-medium'} ${theme.modal?.text || theme.text} mb-2`}>
              Page Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter page title..."
              className={`
                w-full px-3 py-2 rounded border transition-colors
                ${theme.input}
                ${theme.focusRing}
                focus:outline-none
              `}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.font?.label || 'font-medium'} ${theme.modal?.text || theme.text} mb-2`}>
              Content (Optional)
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter page content..."
              rows={4}
              className={`
                w-full px-3 py-2 rounded border transition-colors resize-none
                ${theme.input}
                ${theme.focusRing}
                focus:outline-none
              `}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`
                flex-1 px-4 py-2 rounded ${theme.border} transition-colors
                ${theme.secondary} ${theme.hover}
              `}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
              className={`
                flex-1 px-4 py-2 rounded transition-colors
                ${formData.title.trim() && !isSubmitting
                  ? theme.button
                  : `${theme.secondary} cursor-not-allowed opacity-50`
                }
              `}
            >
              {isSubmitting ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
