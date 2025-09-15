'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useThemeStore from '../../lib/stores/themeStore';
import SourceBadge from './SourceBadge';
import type { ChatCard } from '../../types';

interface ChatNodeData {
  chatCard: ChatCard;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, chatCard: ChatCard) => void;
  isConnecting?: boolean;
}

const ChatNode = memo(({ data, isConnectable, selected }: NodeProps<ChatNodeData>) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { chatCard, onDelete, onContextMenu, isConnecting } = data;

  const handleContextMenu = (e: React.MouseEvent) => {
    console.log('ChatNode context menu triggered', { onContextMenu, chatCard });
    if (onContextMenu) {
      onContextMenu(e, chatCard);
    }
  };

  return (
    <div 
      className="chat-node relative"
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
          id="chat-input-left"
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
          id="chat-input-right"
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
          id="chat-input-top"
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
          id="chat-input-bottom"
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
        {/* Chat Header */}
        <div className="flex justify-between items-start mb-4 cursor-move">
          <h3 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} line-clamp-1 ${theme.text} flex items-center gap-2`}>
            <MessageSquare className={`w-4 h-4 ${theme.accent}`} />
            Q/A
          </h3>
          <button
            onClick={() => onDelete(chatCard.id)}
            className={`text-sm ${theme.secondary} hover:text-red-500 transition-colors`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Query Section */}
        <div className="mb-4 mt-2">
          <h4 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>
            <span className={`px-2 py-1 rounded ${theme.background}`}>Question</span>
          </h4>
          <p className={`text-sm ${theme.text} leading-relaxed`}>
            {chatCard.query}
          </p>
        </div>

        {/* Response Section */}
        <div className="flex-1 overflow-y-auto">
          <h4 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide pt-1`}>
            <span className={`px-2 py-1 rounded ${theme.background}`}>Answer</span>
          </h4>
          <div className={`text-sm ${theme.text} leading-relaxed prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for markdown elements
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                h1: ({ children }) => <h1 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} mb-2 ${theme.text}`}>{children}</h1>,
                h2: ({ children }) => <h2 className={`text-base font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} mb-2 ${theme.text}`}>{children}</h2>,
                h3: ({ children }) => <h3 className={`text-sm font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} mb-1 ${theme.text}`}>{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className={`px-1 py-0.5 rounded text-xs ${theme.background} ${theme.text} border`}>
                      {children}
                    </code>
                  ) : (
                    <pre className={`p-2 rounded text-xs ${theme.background} ${theme.text} border overflow-x-auto`}>
                      <code>{children}</code>
                    </pre>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-4 ${theme.border} pl-3 py-1 my-2 ${theme.secondary} italic`}>
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {chatCard.response}
            </ReactMarkdown>
          </div>
          
          {/* Sources Section */}
          {chatCard.sources && chatCard.sources.length > 0 && (
            <div className="mt-3 pt-3">
              <div className="flex flex-wrap gap-1.5">
                {chatCard.sources.map((source: any, idx: number) => (
                  <SourceBadge key={idx} source={source} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatNode.displayName = 'ChatNode';

export default ChatNode;
