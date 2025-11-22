'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useThemeStore from '../../lib/stores/themeStore';
import type { ChatCard } from '../../types';

interface ChatNodeData {
  chatCard: ChatCard;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, chatCard: ChatCard) => void;
  isConnecting?: boolean;
  isFlashing?: boolean;
}

const ChatNode = memo(({ data, isConnectable, selected }: NodeProps<ChatNodeData>) => {
  const { isDarkMode } = useThemeStore();
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
      <Card className={`
        h-full flex flex-col w-full transition-all duration-200
        border-foreground/25 hover:border-primary/50
        ${selected 
          ? 'ring-2 ring-primary' 
          : 'hover:ring-1 hover:ring-muted'
        }
        ${data.isFlashing ? 'node-flashing' : ''}
      `}>
        {/* Target handles positioned on the card boundaries - only visible when selected */}
        <Handle
          type="target"
          position={Position.Left}
          id="chat-input-left"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
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
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
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
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
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
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        {/* Header */}
        <CardHeader className="pb-3 cursor-move">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Q/A
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(chatCard.id)}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Chat</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden pt-3 px-6 pb-4">
          {/* Question */}
          <p className="text-base font-bold leading-relaxed text-foreground mb-2">
            {chatCard.query}
          </p>

          {/* Answer */}
          <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''} prose-headings:mt-0 prose-headings:mb-2 prose-p:my-0 prose-ul:my-0 prose-ol:my-0`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
                h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 mt-0 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-0 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-0 text-foreground">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-foreground">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1.5 py-0.5 rounded text-xs bg-muted border text-foreground">
                      {children}
                    </code>
                  ) : (
                    <pre className="p-3 rounded text-xs bg-muted border overflow-x-auto">
                      <code className="text-foreground">{children}</code>
                    </pre>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-2 text-muted-foreground italic">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic text-foreground">{children}</em>,
              }}
            >
              {chatCard.response}
            </ReactMarkdown>
          </div>
            
          {/* Sources */}
          {chatCard.sources && chatCard.sources.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-6">
              {chatCard.sources.map((source: any, idx: number) => {
                const sourceText = typeof source === 'string' ? source : source.title || 'Unknown source';
                return (
                  <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
                    {sourceText}
                  </p>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ChatNode.displayName = 'ChatNode';

export default ChatNode;
