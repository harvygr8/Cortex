'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function ChatModal({ isOpen, onClose, onSubmit, projectTitle, initialQuery }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set initial query when modal opens
  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
    } else if (isOpen && !initialQuery) {
      setQuery('');
    }
  }, [isOpen, initialQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSubmit(query.trim());
      setQuery('');
      onClose();
    } catch (error) {
      console.error('Chat submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${theme.background2} rounded-lg shadow-xl w-full max-w-md mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/30">
          <h3 className={`text-lg font-semibold font-ibm-plex-sans ${theme.text}`}>
            Chat with "{projectTitle}"
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:${theme.background} transition-colors ${theme.secondary}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>
              What would you like to know about this project?
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the project content..."
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300/30 rounded-md ${theme.background} ${theme.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm rounded ${theme.secondary} hover:${theme.text} transition-colors`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={`px-4 py-2 text-sm rounded ${theme.button} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ask
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
