'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { Handle, Position, useReactFlow, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { FileIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '../../types';

interface ProjectNodeProps extends NodeProps {
  data: {
    project: {
      id: string;
      title: string;
      description?: string;
    };
    pages: Array<{
      id: string;
      title: string;
      content?: string;
    }>;
    onContextMenu?: (event: React.MouseEvent, project: any) => void;
    onPageClick?: (pageId: string | null, action: string) => void;
    isConnecting?: boolean;
    isFlashing?: boolean;
    flashingPageId?: string;
  };
}

const ProjectNode = memo(({ id, data, isConnectable, selected }: ProjectNodeProps) => {
  const { project, pages, onContextMenu, isConnecting } = data;
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [nodeHeight, setNodeHeight] = useState(400);
  const nodeWidth = 520;

  // Measure actual height and update React Flow node dimensions - let CSS flexbox/grid handle layout
  useEffect(() => {
    const measureHeight = () => {
      if (cardRef.current && containerRef.current) {
        // Use scrollHeight to get full content height
        const height = cardRef.current.scrollHeight;
        if (height > 0 && height !== nodeHeight) {
          setNodeHeight(height);
          // Update container to match measured height
          containerRef.current.style.height = `${height}px`;
          
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
                    height: height,
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
  }, [pages.length, project.title, project.description, nodeHeight, id, nodeWidth, setNodes, updateNodeInternals]);

  // Simple function to strip markdown and get clean preview text
  const getCleanPreviewText = (content: string): string => {
    if (!content) return '';
    return content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^\* /gm, '• ') // Convert bullets to bullet points
      .replace(/^- /gm, '• ') // Convert dashes to bullet points
      .replace(/^\d+\. /gm, '• ') // Convert numbered lists to bullet points
      .trim();
  };

  return (
    <div 
      ref={containerRef}
      className="project-node relative"
      onContextMenu={(e) => onContextMenu && onContextMenu(e, project)}
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
          w-full h-full flex flex-col transition-all duration-200
          border-foreground/25 hover:border-primary/50
          ${selected 
            ? 'ring-2 ring-primary' 
            : 'hover:ring-1 hover:ring-muted'
          }
          ${data.isFlashing && !data.flashingPageId ? 'node-flashing' : ''}
        `}
        style={{ width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
      >
        {/* Source handles positioned at the center of each edge - positioned explicitly for accurate connection points */}
        <Handle
          type="source"
          position={Position.Left}
          id="project-output-left"
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
          id="project-output-right"
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
          id="project-output-top"
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
          id="project-output-bottom"
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
        <CardHeader className="px-6 pt-8 pb-6 cursor-move">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl font-bold mb-3 leading-tight break-words whitespace-normal">
                {project.title}
              </CardTitle>
              {project.description && (
                <CardDescription className="text-base leading-relaxed break-words whitespace-normal">
                  {project.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="px-6 pt-0 pb-8 flex-1">
          {pages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[240px]">
              <div className="text-center space-y-3">
                <FileIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    No pages yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create your first page to get started
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data.onPageClick) {
                      data.onPageClick(null, 'add-page');
                    }
                  }}
                >
                  Add Page
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 auto-rows-fr">
              {pages.map((page: any) => (
                <Card
                  key={page.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data.onPageClick) {
                      data.onPageClick(page.id, 'view-page');
                    }
                  }}
                  className={`cursor-pointer bg-muted/40 hover:bg-accent/50 transition-all border-foreground/25 hover:border-primary/50 ${
                    data.isFlashing && data.flashingPageId === page.id ? 'node-flashing border-primary ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-5 flex flex-col gap-3">
                    <h4 className="text-base font-semibold leading-tight break-words whitespace-normal">
                      {page.title}
                    </h4>
                    {page.content && (
                      <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                        {getCleanPreviewText(page.content)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ProjectNode.displayName = 'ProjectNode';

export default ProjectNode;