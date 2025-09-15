'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { Palette, Trash2, Edit3 } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const ContainerNode = memo(({ id, data, selected }) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Container');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerSize = data.size || { width: 300, height: 200 };
  const [isResizing, setIsResizing] = useState(false);
  const containerColor = data.color || '#3b82f6';
  const containerRef = useRef(null);
  
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
      data.onUpdateLabel(id, label);
    }
  };

  const handleColorChange = (color) => {
    setShowColorPicker(false);
    if (data.onUpdateColor) {
      data.onUpdateColor(id, color);
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };



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
        className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-3 rounded-t-lg cursor-move"
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
            className={`bg-transparent border-none outline-none text-xs font-medium ${theme.text} flex-1`}
            autoFocus
          />
        ) : (
          <span 
            className={`text-xs font-medium ${theme.text} cursor-pointer flex-1 truncate`}
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
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-1 rounded hover:bg-black/10 transition-colors`}
              title="Change color"
            >
              <Palette className="w-3 h-3" style={{ color: containerColor }} />
            </button>
            
            {/* Color picker dropdown */}
            {showColorPicker && (
              <div 
                className={`absolute top-6 right-0 ${theme.background2} border ${theme.border} rounded-lg shadow-lg p-2 z-50`}
                style={{ minWidth: '120px' }}
              >
                <div className="grid grid-cols-5 gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
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
            className={`p-1 rounded hover:bg-black/10 transition-colors`}
            title="Edit label"
          >
            <Edit3 className="w-3 h-3" style={{ color: containerColor }} />
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`p-1 rounded hover:bg-red-500/20 transition-colors`}
            title="Delete container"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
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
          handleSize={16}
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
              containerRef.current.style.width = `${params.width}px`;
              containerRef.current.style.height = `${params.height}px`;
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

      {/* Invisible handles for connections (if needed in the future) */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 pointer-events-none"
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        style={{ visibility: 'hidden' }}
      />
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';

export default ContainerNode;
