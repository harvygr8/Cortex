'use client';
import React from 'react';

import { memo, useEffect, useRef } from 'react';
import { FileText, Trash2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TasksContextMenu = memo(({ x, y, onClose, onDelete, onExportTasks, onDetach }: any) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      data-context-menu
      className="fixed z-50"
      style={{ left: x, top: y }}
      onClick={handleClick}
    >
      <div className="rounded-lg border bg-popover border-border w-48">
        <Button
          variant="ghost"
          onClick={() => handleAction(onExportTasks)}
          className="w-full justify-start px-4 py-2 h-auto font-normal rounded-none rounded-t-lg"
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
          Export Tasks
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => handleAction(onDetach)}
          className="w-full justify-start px-4 py-2 h-auto font-normal rounded-none"
        >
          <Unlink className="w-4 h-4 text-muted-foreground" />
          Detach from project
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => handleAction(onDelete)}
          className="w-full justify-start px-4 py-2 h-auto font-normal rounded-none rounded-b-lg text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
          Delete Task List
        </Button>
      </div>
    </div>
  );
});

TasksContextMenu.displayName = 'TasksContextMenu';

export default TasksContextMenu;
