'use client';

import { useState } from 'react';
import { createNote } from '../api/notes';

export default function NewNoteForm({ onNoteCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createNote({
        title,
        content,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      onNoteCreated();
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="sticky top-0 z-10 bg-white pb-4 border-b">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title your masterpiece"
          className="w-full py-2 text-3xl font-bold border-0 focus:ring-0 focus:outline-none"
          autoFocus
        />
        <div className="flex items-center space-x-4 mt-4">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (comma separated)"
            className="flex-1 px-4 py-2 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>
      
      <div className="min-h-[calc(100vh-20rem)]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="w-full h-full py-2 text-lg text-gray-700 border-0 focus:ring-0 focus:outline-none resize-none"
        />
      </div>
    </form>
  );
} 