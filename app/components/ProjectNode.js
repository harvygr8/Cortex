'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import Link from 'next/link';
import useThemeStore from '../../lib/stores/themeStore';

const ProjectNode = memo(({ data, isConnectable, selected }) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { project, pages, onContextMenu } = data;

  return (
    <div 
      className="project-node relative"
      onContextMenu={(e) => onContextMenu(e, project)}
      style={{ minWidth: '420px', minHeight: '320px' }}
    >
      <div className={`
        p-4 rounded-lg shadow-md hover:shadow-lg transition-all 
        h-full flex flex-col w-full relative
        ${theme.background2}
        border-2 ${selected 
          ? 'border-blue-500 ring-2 ring-blue-300/50' 
          : 'border-gray-300/30 hover:border-blue-300/50'
        }
      `}>
        {/* Source handles positioned on the card boundaries */}
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
            transform: 'translateY(-50%)'
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
            transform: 'translateY(-50%)'
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
            transform: 'translateX(-50%)'
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
            transform: 'translateX(-50%)'
          }}
        />
        {/* Project Header */}
        <div className="flex justify-between items-start mb-4 cursor-move">
          <h3 className={`text-lg font-semibold font-source-sans-3 line-clamp-1 ${theme.text}`}>
            {project.title}
          </h3>
          <span className={`text-sm whitespace-nowrap ml-2 ${theme.secondary} flex items-center gap-1`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {pages.length}
          </span>
        </div>

        {/* Project Description */}
        {project.description && (
          <div className="mb-3 cursor-move">
            <p className={`text-xs ${theme.secondary} line-clamp-2`}>
              {project.description}
            </p>
          </div>
        )}

        {/* Pages Container */}
        <div className="flex-1 overflow-y-auto">
          {pages.length === 0 ? (
            <div className={`p-4 rounded ${theme.background} text-center`}>
              <p className={`text-sm ${theme.secondary}`}>
                No pages yet
              </p>
              <Link href={`/projects/${project.id}`} className={`text-xs ${theme.accent} hover:underline`}>
                Add first page →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pages.slice(0, 8).map((page) => (
                <Link 
                  key={page.id} 
                  href={`/projects/${project.id}/pages/${page.id}`}
                  className="block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`
                    p-3 rounded border transition-all hover:shadow-md
                    ${theme.background} border-gray-200/50 hover:border-blue-200/70
                    cursor-pointer
                  `}>
                    <h4 className={`text-sm font-medium font-source-sans-3 ${theme.text} line-clamp-1`}>
                      {page.title}
                    </h4>
                    {page.content && (
                      <p className={`text-xs ${theme.secondary} line-clamp-2 mt-1`}>
                        {page.content}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {pages.length > 8 && (
                <Link 
                  href={`/projects/${project.id}`}
                  className="block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`
                    p-3 rounded border transition-all hover:shadow-md text-center
                    ${theme.background} border-gray-200/50 hover:border-blue-200/70
                    cursor-pointer
                  `}>
                    <p className={`text-xs ${theme.secondary}`}>
                      +{pages.length - 8} more pages
                    </p>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Project Footer */}
        <div className="mt-3 pt-2 border-t border-gray-200/30 cursor-move">
          <p className={`text-xs ${theme.secondary}`}>
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Recently created'
            }
          </p>
        </div>
      </div>
    </div>
  );
});

ProjectNode.displayName = 'ProjectNode';

export default ProjectNode;
