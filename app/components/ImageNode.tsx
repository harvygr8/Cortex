'use client';
import React from 'react';

import { memo, useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Image as ImageIcon, X, Upload, ExternalLink } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const ImageNode = memo(({ data, isConnectable, selected }: any) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { imageCard, onDelete, onContextMenu, isConnecting } = data;

  const [imageUrl, setImageUrl] = useState(imageCard.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(imageCard.imageAlt || '');
  const [isEditing, setIsEditing] = useState(!imageCard.imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      onContextMenu(e, imageCard);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageAlt(e.target.value);
  };

  const saveImage = async () => {
    if (!imageCard.id || !imageCard.projectId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${imageCard.projectId}/images/${imageCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          imageAlt: imageAlt
        }),
      });

      if (response.ok) {
        setIsEditing(false);
      } else {
        console.error('Failed to save image data');
      }
    } catch (error) {
      console.error('Error saving image data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsLoading(true);
      
      try {
        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', imageCard.projectId);
        
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.imageUrl);
          setImageAlt(file.name);
          
          // Auto-save to database with the new values
          try {
            const saveResponse = await fetch(`/api/projects/${imageCard.projectId}/images/${imageCard.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageUrl: data.imageUrl,
                imageAlt: file.name
              }),
            });

            if (saveResponse.ok) {
              setLastSaved(new Date());
            }
          } catch (saveError) {
            console.error('Error saving image data to database:', saveError);
          }
        } else {
          console.error('Failed to upload image');
          alert('Failed to upload image. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const openImageInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div 
      className="image-node relative"
      onContextMenu={handleContextMenu}
      style={{ minWidth: '420px', minHeight: '320px' }}
    >
      <div className={`
        p-4 rounded-lg shadow-md transition-all
        h-full flex flex-col w-full relative
        ${theme.background2}
        border-2 ${selected 
          ? 'border-blue-500 ring-2 ring-blue-300/50' 
          : theme.border
        }
      `}>
        {/* Target handles positioned on the card boundaries - only visible when selected */}
        <Handle
          type="target"
          position={Position.Left}
          id="image-input-left"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="image-input-right"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="image-input-top"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="image-input-bottom"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />

        {/* Image Header */}
        <div className="flex justify-between items-start mb-4 cursor-move">
          <h3 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} line-clamp-1 ${theme.text} flex items-center gap-2`}>
            <ImageIcon className={`w-4 h-4 ${theme.accent}`} />
            Image
          </h3>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`text-xs ${theme.secondary}`}>Uploading...</span>
              </div>
            )}
            {lastSaved && !isLoading && !isEditing && (
              <span className={`text-xs ${theme.secondary}`}>
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {imageUrl && !isEditing && (
              <button
                onClick={openImageInNewTab}
                className={`text-sm ${theme.secondary} hover:${theme.accent} transition-colors`}
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs px-2 py-1 rounded ${theme.button} hover:opacity-80 transition-opacity`}
              disabled={isLoading}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={() => onDelete(imageCard.id)}
              className={`text-sm ${theme.secondary} hover:text-red-500 transition-colors`}
              disabled={isLoading}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-1`}>
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className={`w-full px-3 py-2 rounded text-sm border ${theme.input} focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-1`}>
                  Alt Text (Optional)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={handleAltChange}
                  placeholder="Description of the image"
                  className={`w-full px-3 py-2 rounded text-sm border ${theme.input} focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={triggerFileUpload}
                  className={`flex-1 px-3 py-2 rounded text-sm border border-dashed ${theme.border} ${theme.hover} transition-colors flex items-center justify-center gap-2`}
                >
                  <Upload className="w-3 h-3" />
                  Upload File
                </button>
                <button
                  onClick={saveImage}
                  disabled={!imageUrl || isLoading}
                  className={`px-4 py-2 rounded text-sm font-medium ${theme.button} disabled:opacity-50 hover:opacity-80 transition-opacity`}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            // Display Mode
            <div className="flex-1 flex flex-col">
              {imageUrl ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-200 dark:border-gray-600 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={imageAlt || 'Image'}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const nextSibling = target.nextSibling as HTMLElement;
                        if (nextSibling) {
                          nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center text-center p-4">
                      <ImageIcon className={`w-8 h-8 ${theme.secondary} mb-2`} />
                      <p className={`text-sm ${theme.secondary}`}>
                        Failed to load image
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className={`text-xs ${theme.accent} hover:underline mt-1`}
                      >
                        Edit URL
                      </button>
                    </div>
                  </div>
                  {imageAlt && (
                    <p className={`text-xs ${theme.secondary} mt-2 text-center italic`}>
                      {imageAlt}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <ImageIcon className={`w-12 h-12 ${theme.secondary} mb-3`} />
                  <p className={`text-sm ${theme.secondary} mb-3`}>
                    No image set
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`text-sm ${theme.accent} hover:underline`}
                  >
                    Add an image →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ImageNode.displayName = 'ImageNode';

export default ImageNode;
