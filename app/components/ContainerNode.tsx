'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { NodeResizer } from 'reactflow';
import { Palette, Trash2, Edit3 } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const ContainerNode = memo(({ id, data, selected }: any) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Container');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerSize = data.size || { width: 300, height: 200 };
  const [isResizing, setIsResizing] = useState(false);
  const containerColor = data.color || '#3b82f6';
  const containerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  //
  
  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280'  // gray
  ];

  const handleLabelSubmit = () => {
    setIsEditing(false);
    if (data.onUpdateLabel) {
      const containerId = id.replace('container-', '');
      data.onUpdateLabel(containerId, label);
    }
  };

  const handleColorChange = (color: string) => {
    console.log('ContainerNode: handleColorChange called with color:', color);
    console.log('ContainerNode: Current containerColor:', containerColor);
    console.log('ContainerNode: Container ID:', id);
    console.log('ContainerNode: data.onUpdateColor exists:', !!data.onUpdateColor);
    console.log('ContainerNode: data.onUpdateColor function:', data.onUpdateColor);
    
    setShowColorPicker(false);
    if (data.onUpdateColor) {
      console.log('ContainerNode: About to call data.onUpdateColor with:', id, color);
      console.log('ContainerNode: Function type:', typeof data.onUpdateColor);
      try {
        const containerId = id.replace('container-', '');
        console.log('ContainerNode: Calling data.onUpdateColor with parameters:', containerId, color);
        const result = data.onUpdateColor(containerId, color);
        console.log('ContainerNode: data.onUpdateColor call completed, result:', result);
        if (result && typeof result.then === 'function') {
          console.log('ContainerNode: data.onUpdateColor returned a promise');
          result.then(() => console.log('ContainerNode: Promise resolved')).catch((err: any) => console.error('ContainerNode: Promise rejected:', err));
        }
      } catch (error) {
        console.error('ContainerNode: Error calling data.onUpdateColor:', error);
      }
    } else {
      console.error('ContainerNode: data.onUpdateColor is not defined!');
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      const containerId = id.replace('container-', '');
      data.onDelete(containerId);
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColorPicker]);



  return (
    <div 
      ref={containerRef}
      className={`relative border-2 border-dashed rounded-lg ${
        isResizing ? '' : 'transition-all duration-200'
      } ${selected ? (isResizing ? '' : 'shadow-lg ring-2 ring-blue-400') : 'shadow-sm'}`}
      style={{
        width: '100%',
        height: '100%',
        borderColor: selected ? '#3b82f6' : containerColor, // Blue border when selected
        backgroundColor: `${containerColor}10`, // 10% opacity
        borderWidth: selected ? '3px' : '2px', // Thicker border when selected
        willChange: isResizing ? 'width, height' : undefined
      }}
    >
      {/* Header with label and controls */}
      <div 
        className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 rounded-t-lg cursor-move"
        style={{ backgroundColor: `${containerColor}20` }}
        onMouseDown={(e) => {
          // Only allow dragging if clicking on the header area itself, not the controls
          if (e.target === e.currentTarget) {
            // This allows ReactFlow to handle the drag
          } else {
            // Prevent drag if clicking on controls
            e.stopPropagation();
          }
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSubmit();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setLabel(data.label || 'Container');
              }
            }}
            className={`bg-transparent border-none outline-none text-lg font-medium ${theme.text} flex-1`}
            autoFocus
          />
        ) : (
          <span 
            className={`text-lg font-medium ${theme.text} cursor-pointer flex-1 truncate`}
            onClick={() => setIsEditing(true)}
            style={{ color: containerColor }}
          >
            {label}
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* Color picker button */}
          <div className="relative">
            <button
              onClick={(e) => {
                console.log('ContainerNode: Color picker button clicked, current state:', showColorPicker);
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-1.5 rounded hover:bg-black/10 transition-colors nodrag`}
              title="Change color"
            >
              <Palette className="w-4 h-4" style={{ color: containerColor }} />
            </button>
            
            {/* Color picker dropdown */}
            {showColorPicker && (
              <div 
                ref={colorPickerRef}
                className={`absolute top-6 right-0 ${theme.background2} border ${theme.border} rounded-lg shadow-lg p-2 z-50 nodrag`}
                style={{ minWidth: '120px' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-5 gap-1">
                  {predefinedColors.map((color: any) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        console.log('ContainerNode: Color button clicked:', color);
                        e.stopPropagation();
                        handleColorChange(color);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform nodrag ${
                        color === containerColor ? 'border-white shadow-lg' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`p-1.5 rounded hover:bg-black/10 transition-colors`}
            title="Edit label"
          >
            <Edit3 className="w-4 h-4" style={{ color: containerColor }} />
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`p-1.5 rounded hover:bg-red-500/20 transition-colors`}
            title="Delete container"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* ReactFlow's built-in NodeResizer - optimized for performance */}
      {selected && (
        <NodeResizer
          color={containerColor}
          isVisible={selected}
          minWidth={50}
          minHeight={30}
          handleClassName="nodrag"
          handleStyle={{
            border: `2px solid ${containerColor}`,
            background: '#ffffff',
            borderRadius: 6,
            boxShadow: '0 0 0 2px rgba(0,0,0,0.06)'
          }}
          lineStyle={{
            borderColor: containerColor,
            borderWidth: 2
          }}
          onResizeStart={() => {
            setIsResizing(true);
            if (data.onStartResize) {
              const containerId = id.replace('container-', '');
              data.onStartResize(containerId);
            }
          }}
          onResize={(event, params) => {
            // Avoid React state during drag; update DOM directly for smoothness
            if (containerRef.current) {
              (containerRef.current as HTMLElement).style.width = `${params.width}px`;
              (containerRef.current as HTMLElement).style.height = `${params.height}px`;
            }
          }}
          onResizeEnd={async (event, params) => {
            setIsResizing(false);

            // Sync React state once at the end
            // Note: containerSize is derived from data.size; keep data authoritative
            data.size = { width: params.width, height: params.height };

            if (data.onEndResize) {
              const containerId = id.replace('container-', '');
              data.onEndResize(containerId);
            }

            // Save to database
            const containerId = id.replace('container-', '');
            const projectId = data.containerCard?.projectId;

            if (projectId) {
              try {
                await fetch(`/api/projects/${projectId}/containers/${containerId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    width: params.width, 
                    height: params.height 
                  }),
                });
              } catch (error) {
                console.error('Error saving container size:', error);
              }
            }
          }}
        />
      )}

      {/* No handles - containers are independent and don't support connections */}
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';

export default ContainerNode;
