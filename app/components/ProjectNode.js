'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const ProjectNode = memo(({ data, isConnectable, selected }) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { project, pages, onContextMenu } = data;

  // Calculate dynamic height based on content
  const calculateNodeHeight = () => {
    const headerHeight = 80; // Header section height
    const minContentHeight = 120; // Minimum content area for empty state
    const pageBlockHeight = 72; // Height of each page block
    const pageBlockGap = 8; // Gap between page blocks
    const padding = 24; // Total padding (top + bottom)
    
    if (pages.length === 0) {
      return headerHeight + minContentHeight + padding;
    }
    
    // Calculate number of rows (2 columns per row, plus "more" block if needed)
    const displayedPages = Math.min(pages.length, 8);
    const hasMoreBlock = pages.length > 8 ? 1 : 0;
    const totalBlocks = displayedPages + hasMoreBlock;
    const rows = Math.ceil(totalBlocks / 2);
    
    // Calculate content height based on rows
    const contentHeight = (rows * pageBlockHeight) + ((rows - 1) * pageBlockGap);
    const totalHeight = headerHeight + contentHeight + padding;
    
    // Set reasonable min/max bounds
    return Math.max(200, Math.min(500, totalHeight));
  };

  const nodeHeight = calculateNodeHeight();

  // Simple function to strip markdown and get clean preview text
  const getCleanPreviewText = (content) => {
    if (!content) return '';
    return content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^\* /gm, '• ') // Convert bullets
      .replace(/^\d+\. /gm, '') // Remove numbered lists
      .trim();
  };

  return (
    <div 
      className="project-node relative"
      onContextMenu={(e) => onContextMenu(e, project)}
      style={{ width: '420px', height: `${nodeHeight}px` }}
    >
      <div 
        className={`
          rounded-lg shadow-md hover:shadow-lg transition-all 
          w-full h-full relative grid grid-rows-[auto,1fr]
          ${theme.background2}
          border-2 ${selected 
            ? 'border-blue-500 ring-2 ring-blue-300/50' 
            : `${theme.border} hover:border-blue-300/50`
          }
        `}
        style={{ 
          width: '420px',
          height: `${nodeHeight}px`
        }}
      >
        {/* Source handles positioned absolutely outside the content flow */}
        <Handle
          type="source"
          position={Position.Left}
          id="project-output-left"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            position: 'absolute',
            zIndex: 1000
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="project-output-right"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            position: 'absolute',
            zIndex: 1000
          }}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="project-output-top"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 1000
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="project-output-bottom"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 1000
          }}
        />
        {/* Header Row */}
        <div className="px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} line-clamp-1 ${theme.text} flex-1`}>
              {project.title}
            </h3>
            <span className={`text-sm whitespace-nowrap ${theme.secondary} flex items-center gap-1`}>
              <FileText className="w-4 h-4" />
              {pages.length}
            </span>
          </div>
          {project.description && (
            <p className={`text-xs ${theme.secondary} line-clamp-1 mt-2`}>
              {project.description}
            </p>
          )}
        </div>
        {/* Content Row */}
        <div className="px-3">
          {pages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className={`text-sm ${theme.secondary} mb-2`}>
                  No pages yet
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data.onPageClick) {
                      data.onPageClick(null, 'add-page');
                    }
                  }}
                  className={`text-xs ${theme.accent} hover:underline cursor-pointer`}
                >
                  Add first page →
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="grid grid-cols-2 gap-2">
                {pages.slice(0, 8).map((page) => (
                  <div 
                    key={page.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (data.onPageClick) {
                        data.onPageClick(page.id, 'view-page');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div 
                      className={`p-3 rounded border transition-all hover:shadow-sm hover:scale-[1.02] ${theme.background} ${theme.border}`}
                      style={{ 
                        height: '72px'
                      }}
                    >
                      <h4 className={`text-xs font-medium ${theme.font?.body || 'font-ibm-plex-sans'} ${theme.text} line-clamp-1 mb-1`}>
                        {page.title}
                      </h4>
                      {page.content && (
                        <p className={`text-xs ${theme.secondary} line-clamp-2 leading-tight`}>
                          {getCleanPreviewText(page.content)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {pages.length > 8 && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (data.onPageClick) {
                        data.onPageClick(null, 'view-all-pages');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div 
                      className={`p-3 rounded border transition-all hover:shadow-sm hover:scale-[1.02] text-center flex items-center justify-center ${theme.background} ${theme.border}`}
                      style={{ 
                        height: '72px'
                      }}
                    >
                      <p className={`text-xs ${theme.secondary} font-medium`}>
                        +{pages.length - 8} more
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProjectNode.displayName = 'ProjectNode';

export default ProjectNode;