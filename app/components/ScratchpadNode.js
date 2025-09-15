'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { StickyNote, X, Save } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const ScratchpadNode = memo(({ data, isConnectable, selected }) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { scratchpadCard, onDelete, onContextMenu } = data;

  const [text, setText] = useState(scratchpadCard.text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const MAX_CHARS = 1500;

  const saveText = async () => {
    if (!scratchpadCard.id || !scratchpadCard.projectId) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${scratchpadCard.projectId}/scratchpads/${scratchpadCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      } else {
        console.error('Failed to save scratchpad text');
      }
    } catch (error) {
      console.error('Error saving scratchpad text:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save with debouncing
  useEffect(() => {
    if (text !== (scratchpadCard.text || '')) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 1 second of no typing
      saveTimeoutRef.current = setTimeout(async () => {
        await saveText();
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [text, scratchpadCard.text]);

  const handleContextMenu = (e) => {
    if (onContextMenu) {
      onContextMenu(e, scratchpadCard);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
    }
  };

  const remainingChars = MAX_CHARS - text.length;

  return (
    <div 
      className="scratchpad-node relative"
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
        {/* Target handles positioned on the card boundaries */}
        <Handle
          type="target"
          position={Position.Left}
          id="scratchpad-input-left"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="scratchpad-input-right"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="scratchpad-input-top"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="scratchpad-input-bottom"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* Scratchpad Header */}
        <div className="flex justify-between items-start mb-4 cursor-move">
          <h3 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} line-clamp-1 ${theme.text} flex items-center gap-2`}>
            <StickyNote className={`w-4 h-4 ${theme.accent}`} />
            Scratchpad
          </h3>
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-1">
                <Save className={`w-3 h-3 ${theme.secondary} animate-pulse`} />
                <span className={`text-xs ${theme.secondary}`}>Saving...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <span className={`text-xs ${theme.secondary}`}>
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => onDelete(scratchpadCard.id)}
              className={`text-sm ${theme.secondary} hover:text-red-500 transition-colors`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder="Start writing your notes here..."
            className={`
              flex-1 w-full p-3 rounded border resize-none text-sm
              ${theme.input} 
              focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent
              ${remainingChars < 50 ? 'border-yellow-400 focus:ring-yellow-400' : ''}
              ${remainingChars === 0 ? 'border-red-400 focus:ring-red-400' : ''}
            `}
            style={{ minHeight: '200px' }}
          />
          
          {/* Character Counter */}
          <div className={`mt-2 flex justify-between items-center text-xs`}>
            <span className={theme.secondary}>
              {text.split('\n').length} lines
            </span>
            <span className={`
              ${remainingChars < 50 ? 'text-yellow-600' : theme.secondary}
              ${remainingChars === 0 ? 'text-red-600 font-medium' : ''}
            `}>
              {text.length}/{MAX_CHARS} characters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ScratchpadNode.displayName = 'ScratchpadNode';

export default ScratchpadNode;
