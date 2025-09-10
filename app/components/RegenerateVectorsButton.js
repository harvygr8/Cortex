'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import useThemeStore from '../../lib/stores/themeStore';
import VectorProcessingModal from './VectorProcessingModal';

export default function RegenerateVectorsButton({ projectId, projectTitle }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isProcessingVectors, setIsProcessingVectors] = useState(false);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleRegenerate = async () => {
    if (!projectId) {
      toast.error('Invalid project ID');
      return;
    }

    setIsRegenerating(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/regenerate-vectors`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Vector regeneration result:', data);
      
      // Show vector processing modal
      setIsProcessingVectors(true);
      setTimeout(() => {
        setIsProcessingVectors(false);
        // Show toast after modal closes
        toast.success('Vectors regenerated successfully!');
      }, 3000); // Show for 3 seconds
      
    } catch (error) {
      console.error('Error regenerating vectors:', error);
      toast.error(error.message || 'Error regenerating vectors');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating || isProcessingVectors}
        className={`p-3 rounded-lg ${theme.button} hover:opacity-80 transition-opacity flex items-center gap-2 ${
          isRegenerating || isProcessingVectors ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Regenerate vectors with FAISS semantic search and BM25 keyword search for improved retrieval"
      >
        {isRegenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Regenerating...</span>
          </>
        ) : isProcessingVectors ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Regenerate Vectors</span>
          </>
        )}
      </button>

      {/* Vector Processing Modal */}
      <VectorProcessingModal
        isOpen={isProcessingVectors}
        onClose={() => setIsProcessingVectors(false)}
        message="Regenerating vectors for your project..."
      />
    </>
  );
}
