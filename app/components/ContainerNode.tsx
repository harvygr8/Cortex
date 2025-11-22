'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { NodeResizer, NodeProps } from 'reactflow';
import { Palette, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ContainerCard } from '../../types';

interface ContainerNodeData {
  containerCard?: ContainerCard;
  label?: string;
  color?: string;
  size?: { width: number; height: number };
  onUpdateLabel?: (id: string, label: string) => void | Promise<void>;
  onUpdateColor?: (id: string, color: string) => void | Promise<void>;
  onDelete?: (id: string) => void;
  onStartResize?: (id: string) => void;
  onEndResize?: (id: string) => void;
  isFlashing?: boolean;
}

const ContainerNode = memo(({ id, data, selected }: NodeProps<ContainerNodeData>) => {
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
      className={`relative border-2 border-dashed rounded-xl backdrop-blur-sm ${
        isResizing ? '' : 'transition-all duration-200'
      } ${selected ? (isResizing ? '' : 'ring-2 ring-primary/50') : 'hover:border-opacity-80'} ${data.isFlashing ? 'node-flashing' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        borderColor: selected ? 'hsl(var(--primary))' : containerColor,
        backgroundColor: `${containerColor}15`, // 15% opacity for better visibility
        borderWidth: selected ? '3px' : '2px',
        willChange: isResizing ? 'width, height' : undefined
      }}
    >
      {/* Header with label and controls */}
      <div 
        className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 rounded-t-xl cursor-move backdrop-blur-md border-b border-border/50"
        style={{ backgroundColor: `${containerColor}25` }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            // This allows ReactFlow to handle the drag
          } else {
            e.stopPropagation();
          }
        }}
      >
        {isEditing ? (
          <Input
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
            className="bg-transparent border-none shadow-none text-lg font-semibold flex-1 h-auto px-0 focus-visible:ring-0"
            style={{ color: containerColor }}
            autoFocus
          />
        ) : (
          <span 
            className="text-lg font-semibold cursor-pointer flex-1 truncate hover:opacity-80 transition-opacity"
            onClick={() => setIsEditing(true)}
            style={{ color: containerColor }}
          >
            {label}
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* Color picker button */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    console.log('ContainerNode: Color picker button clicked, current state:', showColorPicker);
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 nodrag hover:bg-muted"
                >
                  <Palette className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change color</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Color picker dropdown */}
            {showColorPicker && (
              <div 
                ref={colorPickerRef}
                className="absolute top-10 right-0 bg-card border border-border rounded-lg p-3 z-50 nodrag"
                style={{ minWidth: '160px' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-medium text-muted-foreground mb-2">Choose Color</p>
                <div className="grid grid-cols-5 gap-2">
                  {predefinedColors.map((color: any) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        console.log('ContainerNode: Color button clicked:', color);
                        e.stopPropagation();
                        handleColorChange(color);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-7 h-7 rounded-md border-2 hover:scale-110 transition-transform nodrag ${
                        color === containerColor ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 w-8 hover:bg-muted"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit label</p>
            </TooltipContent>
          </Tooltip>

          {/* Delete button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete container</p>
            </TooltipContent>
          </Tooltip>
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
            background: 'hsl(var(--background))',
            borderRadius: 6,
            boxShadow: '0 0 0 2px hsl(var(--border) / 0.3)'
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
