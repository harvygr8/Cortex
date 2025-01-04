import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';
import { FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function FileUpload({ projectId, onFileProcessed }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isDarkMode, theme } = useThemeStore();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!projectId) {
      toast.error('Invalid project ID');
      return;
    }

    setIsProcessing(true);
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
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
        accept=".md,.txt,.pdf"
      />
      <label
        htmlFor="file-upload"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
          isDarkMode ? theme.dark.primary : theme.light.primary
        }`}
      >
        <FaUpload className={isProcessing ? 'animate-spin' : ''} />
        {isProcessing ? 'Converting...' : 'Import Document'}
      </label>
    </div>
  );
} 