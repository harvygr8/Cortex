'use client';
import React from 'react';

import { useEffect, useRef } from 'react';
import { Trash2, Copy, Download, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onCopyResponse: () => void;
  onExportToFile: () => void;
  onDetach: () => void;
}

export default function ChatContextMenu({ 
  x, 
  y, 
  onClose, 
  onDelete, 
  onCopyResponse, 
  onExportToFile,
  onDetach
}: ChatContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as any)) {
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

  const menuItems = [
    {
      icon: Copy,
      label: 'Copy response',
      onClick: onCopyResponse,
      isDestructive: false
    },
    {
      icon: Download,
      label: 'Export to file',
      onClick: onExportToFile,
      isDestructive: false
    },
    {
      icon: Unlink,
      label: 'Detach from project',
      onClick: onDetach,
      isDestructive: false
    },
    {
      icon: Trash2,
      label: 'Delete chat',
      onClick: onDelete,
      isDestructive: true
    }
  ];

  return (
    <div
      ref={menuRef}
      data-context-menu
      className="fixed z-50 bg-popover border border-border rounded-lg w-48"
      style={{
        left: x,
        top: y,
      }}
    >
      {menuItems.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === menuItems.length - 1;
        return (
          <Button
            key={index}
            variant="ghost"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full justify-start px-4 py-2 h-auto font-normal rounded-none ${
              isFirst ? 'rounded-t-lg' : ''
            } ${isLast ? 'rounded-b-lg' : ''} ${item.isDestructive ? 'text-destructive hover:text-destructive' : ''}`}
          >
            <item.icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
