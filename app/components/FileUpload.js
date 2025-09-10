import { useState, useRef } from 'react';
import useThemeStore from '../../lib/stores/themeStore';
import { FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import VectorProcessingModal from './VectorProcessingModal';

export default function FileUpload({ projectId, onFileProcessed }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingVectors, setIsProcessingVectors] = useState(false);
  const fileInputRef = useRef(null);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!projectId) {
      toast.error('Invalid project ID');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const url = `/api/projects/${projectId}/upload`;
    console.log('Attempting upload to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Show vector processing modal
      setIsProcessingVectors(true);
      setTimeout(() => {
        setIsProcessingVectors(false);
        // Show toast after modal closes
        toast.success('Document imported successfully');
      }, 3000); // Show for 3 seconds
      
      onFileProcessed(data);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Error importing document');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.markdown"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || isProcessingVectors}
        className={`p-3 rounded-lg ${theme.button} hover:opacity-80 transition-opacity flex items-center gap-2`}
        title="Import Document"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {isUploading ? 'Importing...' : isProcessingVectors ? 'Processing...' : 'Import Document'}
      </button>

      {/* Vector Processing Modal */}
      <VectorProcessingModal
        isOpen={isProcessingVectors}
        onClose={() => setIsProcessingVectors(false)}
        message="Processing your uploaded document..."
      />
    </>
  );
} 