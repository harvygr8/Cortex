'use client';
import React from 'react';

import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { StickyNote, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
const ScratchpadNode = memo(({ data, isConnectable, selected }: any) => {
  const { scratchpadCard, onDelete, onContextMenu, isConnecting } = data;

  const [text, setText] = useState(scratchpadCard.text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      onContextMenu(e, scratchpadCard);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      style={{ minWidth: '550px', minHeight: '420px' }}
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
          id="scratchpad-input-left"
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
          id="scratchpad-input-right"
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
          id="scratchpad-input-top"
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
          id="scratchpad-input-bottom"
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
              <StickyNote className="w-5 h-5" />
              Scratchpad
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(scratchpadCard.id)}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Scratchpad</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden pt-4 px-6">
          <div className="h-full flex flex-col">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Start writing your thoughts here"
              className={`
                flex-1 resize-none border-foreground/25 hover:border-primary/50 focus-visible:border-primary/50 text-base leading-relaxed
                ${remainingChars < 50 && remainingChars > 0 ? 'text-yellow-600' : ''}
                ${remainingChars === 0 ? 'text-destructive' : ''}
              `}
              style={{ minHeight: '380px' }}
            />
          </div>
        </CardContent>

        {/* Footer with Character Counter */}
        <CardFooter className="pt-3">
          <div className="flex items-center w-full">
            <Badge 
              variant={remainingChars === 0 ? "destructive" : remainingChars < 50 ? "outline" : "secondary"}
              className="text-xs"
            >
              {text.length}/{MAX_CHARS}
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});

ScratchpadNode.displayName = 'ScratchpadNode';

export default ScratchpadNode;
