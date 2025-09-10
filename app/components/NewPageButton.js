'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';
import VectorProcessingModal from './VectorProcessingModal';

export default function NewPageButton({ projectId, onPageCreated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [isProcessingVectors, setIsProcessingVectors] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('initializing');
  const [processingProgress, setProcessingProgress] = useState(0);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const simulateVectorProcessing = () => {
    setIsProcessingVectors(true);
    setProcessingStatus('initializing');
    setProcessingProgress(0);
    
    const steps = [
      { status: 'chunking', progress: 25 },
      { status: 'embedding', progress: 50 },
      { status: 'indexing', progress: 75 },
      { status: 'finalizing', progress: 100 }
    ];
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setProcessingStatus(step.status);
        setProcessingProgress(step.progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessingVectors(false);
          setProcessingProgress(0);
        }, 500);
      }
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

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
      
      // Show vector processing modal
      simulateVectorProcessing();
      
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
        className={`p-3 rounded-lg ${theme.button} hover:opacity-80 transition-opacity`}
        title="Create New Page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${theme.background2} ${theme.text} shadow-xl ${theme.border} border`}>
            <h2 className="text-2xl font-semibold font-source-sans-3 mb-4">
              Create New Page
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold ${theme.secondary}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 ${theme.input}`}
                  placeholder="Enter page title..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${theme.button}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${theme.button}`}
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vector Processing Modal */}
      <VectorProcessingModal
        isOpen={isProcessingVectors}
        onClose={() => setIsProcessingVectors(false)}
        status={processingStatus}
        progress={processingProgress}
        message="Processing your new page..."
      />
    </>
  );
} 