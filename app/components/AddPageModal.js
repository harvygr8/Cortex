'use client';

import { useState } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
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
        ${theme.background2} rounded-lg shadow-xl border border-gray-200/30
        w-full max-w-md mx-4
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
          <h2 className={`text-lg font-semibold font-source-sans-3 ${theme.text} flex items-center gap-2`}>
            <FaPlus className={`w-4 h-4 ${theme.accent}`} />
            Add Page to {project.title}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:${theme.background} transition-colors`}
          >
            <FaTimes className={`w-4 h-4 ${theme.secondary}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>
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
                ${theme.input?.background || theme.background} ${theme.input?.text || theme.text} 
                ${theme.input?.border || 'border-gray-300/30'}
                ${theme.focusRing || 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
                focus:outline-none ${theme.input?.placeholder || ''}
              `}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>
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
                ${theme.input?.background || theme.background} ${theme.input?.text || theme.text} 
                ${theme.input?.border || 'border-gray-300/30'}
                ${theme.focusRing || 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
                focus:outline-none ${theme.input?.placeholder || ''}
              `}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`
                flex-1 px-4 py-2 rounded border transition-colors
                ${theme.button?.cancel || `${theme.secondary} border-gray-300/30 ${theme.hover?.secondary || 'hover:bg-gray-100'}`}
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
                  ? (theme.button?.primary || 'bg-gray-800 text-white hover:bg-gray-700')
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
