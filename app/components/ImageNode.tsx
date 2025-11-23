'use client';
import React from 'react';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { Image as ImageIcon, Trash2, Upload, ExternalLink, Edit3, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
const ImageNode = memo(({ id, data, isConnectable, selected }: any) => {
  const { imageCard, onDelete, onContextMenu, isConnecting } = data;
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [imageUrl, setImageUrl] = useState(imageCard.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(imageCard.imageAlt || '');
  const [isEditing, setIsEditing] = useState(!imageCard.imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [nodeHeight, setNodeHeight] = useState(320);
  const nodeWidth = 420;

  // Measure actual height and update React Flow node dimensions - let CSS flexbox/grid handle layout
  useEffect(() => {
    const measureHeight = () => {
      if (cardRef.current && containerRef.current) {
        // Use scrollHeight to get full content height
        const height = cardRef.current.scrollHeight;
        // Ensure minimum height
        const finalHeight = Math.max(height, 320);
        
        if (finalHeight !== nodeHeight) {
          setNodeHeight(finalHeight);
          // Update container to match measured height
          containerRef.current.style.height = `${finalHeight}px`;
          
          // Update React Flow node dimensions so connection points are calculated correctly
          // React Flow expects numeric values for width/height in style
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === id) {
                return {
                  ...node,
                  style: {
                    ...node.style,
                    width: nodeWidth,
                    height: finalHeight,
                  },
                };
              }
              return node;
            })
          );
          
          // Force React Flow to update node internals (handles, etc) immediately
          requestAnimationFrame(() => {
            updateNodeInternals(id);
          });
        }
      }
    };
    
    // Measure after layout completes
    const timeoutId = setTimeout(measureHeight, 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(measureHeight);
    });
    
    // Use ResizeObserver to detect size changes
    if (cardRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        measureHeight();
      });
      resizeObserver.observe(cardRef.current);
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
    
    return () => clearTimeout(timeoutId);
  }, [id, nodeHeight, nodeWidth, setNodes, updateNodeInternals, imageUrl, isEditing]);

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
            toast.error('Failed to upload image. Please try again.');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Error uploading image. Please try again.');
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
      ref={containerRef}
      className="image-node relative"
      onContextMenu={handleContextMenu}
      style={{ 
        width: `${nodeWidth}px`, 
        height: `${nodeHeight}px`,
        // Ensure React Flow can calculate connection points correctly
        boxSizing: 'border-box'
      }}
    >
      <Card 
        ref={cardRef}
        className={`
        h-full flex flex-col w-full transition-all duration-200
        border-foreground/25 hover:border-primary/50
        ${selected 
          ? 'ring-2 ring-primary' 
          : 'hover:ring-1 hover:ring-muted'
        }
        ${data.isFlashing ? 'node-flashing' : ''}
      `}
        style={{ width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
      >
        {/* Target handles positioned on the card boundaries - only visible when selected */}
        <Handle
          type="target"
          position={Position.Left}
          id="image-input-left"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            position: 'absolute',
            zIndex: 1000,
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
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            position: 'absolute',
            zIndex: 1000,
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
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 1000,
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
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 1000,
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        {/* Source handles positioned at the center of each edge - positioned explicitly for accurate connection points */}
        <Handle
          type="source"
          position={Position.Left}
          id="image-output-left"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            position: 'absolute',
            zIndex: 1000,
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="image-output-right"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            position: 'absolute',
            zIndex: 1000,
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="image-output-top"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 1000,
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="image-output-bottom"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 1000,
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />

        {/* Header */}
        <CardHeader className="pb-3 cursor-move">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Image
            </CardTitle>
            <div className="flex items-center gap-1">
              {isLoading && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading
                </Badge>
              )}
              {lastSaved && !isLoading && !isEditing && (
                <Badge variant="outline" className="text-xs">
                  {lastSaved.toLocaleTimeString()}
                </Badge>
              )}
              {imageUrl && !isEditing && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openImageInNewTab}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open in new tab</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-8 w-8"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditing ? 'Cancel editing' : 'Edit image'}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(imageCard.id)}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Image</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden pt-4 px-6 flex flex-col">
          <div className="flex-1 flex flex-col">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-sm font-medium">
                    Image URL
                  </Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageAlt" className="text-sm font-medium">
                    Alt Text <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="imageAlt"
                    type="text"
                    value={imageAlt}
                    onChange={handleAltChange}
                    placeholder="Description of the image"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerFileUpload}
                    className="flex-1 border-dashed"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    onClick={saveImage}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
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
                    <div className="flex-1 flex items-center justify-center bg-muted/30 dark:bg-white rounded-lg border-2 border-dashed border-border overflow-hidden">
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
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Failed to load image
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit URL
                        </Button>
                      </div>
                    </div>
                    {imageAlt && (
                      <p className="text-xs text-muted-foreground mt-3 text-center italic">
                        {imageAlt}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        No image set
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Add Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ImageNode.displayName = 'ImageNode';

export default ImageNode;
