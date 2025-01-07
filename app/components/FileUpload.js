import { useState, useRef } from 'react';
import useThemeStore from '../../lib/stores/themeStore';
import { FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function FileUpload({ projectId, onFileProcessed }) {
  const { isDarkMode, theme } = useThemeStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
      toast.success('Document imported successfully');
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
        accept=".md,.markdown"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          isDarkMode 
            ? `${theme.dark.primary} hover:bg-opacity-80` 
            : `${theme.light.primary} hover:bg-opacity-80`
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          upload_file
        </span>
        {isUploading ? 'Importing...' : 'Import Document'}
      </button>
    </>
  );
} 