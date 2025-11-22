'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Edit, Trash2, Plus, Upload, RotateCcw, ClipboardList, FileText, Image as ImageIcon, ChevronRight, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onChat?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddPage?: () => void;
  onImportData?: () => void;
  onRegenerateVectors?: () => void;
  onCreateTasks?: () => void;
  onCreateScratchpad?: () => void;
  onCreateImage?: () => void;
}

export default function ContextMenu({ 
  x, 
  y, 
  onClose, 
  onChat, 
  onEdit, 
  onDelete, 
  onAddPage, 
  onImportData, 
  onRegenerateVectors, 
  onCreateTasks, 
  onCreateScratchpad, 
  onCreateImage 
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showNodeSubmenu, setShowNodeSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

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

  const handleNodeSubmenuHover = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      x: rect.right + 5,
      y: rect.top
    });
    setShowNodeSubmenu(true);
  };

  const handleNodeSubmenuLeave = () => {
    // Add a small delay to prevent premature closing
    setTimeout(() => setShowNodeSubmenu(false), 100);
  };

  const nodeTypes = [
    {
      icon: ClipboardList,
      label: 'Tasks Node',
      onClick: onCreateTasks,
      color: 'text-muted-foreground',
      description: 'Create and manage task lists'
    },
    {
      icon: StickyNote,
      label: 'Scratchpad Node',
      onClick: onCreateScratchpad,
      color: 'text-muted-foreground',
      description: 'Write notes and thoughts'
    },
    {
      icon: ImageIcon,
      label: 'Image Node',
      onClick: onCreateImage,
      color: 'text-muted-foreground',
      description: 'Display images and visuals'
    }
  ];

  const menuItems = [
    {
      icon: MessageSquare,
      label: 'Ask a Question',
      onClick: onChat,
      color: 'text-muted-foreground'
    },
    {
      icon: FileText,
      label: 'Add page',
      onClick: onAddPage,
      color: 'text-foreground'
    },
    {
      icon: Plus,
      label: 'Add Node',
      hasSubmenu: true,
      color: 'text-muted-foreground'
    },
    {
      icon: Upload,
      label: 'Import page',
      onClick: onImportData,
      color: 'text-foreground'
    },
    {
      icon: RotateCcw,
      label: 'Regenerate vectors',
      onClick: onRegenerateVectors,
      color: 'text-foreground'
    },
    {
      icon: Edit,
      label: 'Edit project',
      onClick: onEdit,
      color: 'text-foreground'
    },
    {
      icon: Trash2,
      label: 'Delete project',
      onClick: onDelete,
      color: 'text-destructive'
    }
  ];

  return (
    <>
      <div
        ref={menuRef}
        data-context-menu
        className="fixed z-50 bg-popover border border-border rounded-lg py-2 w-48"
        style={{
          left: x,
          top: y,
        }}
      >
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="relative"
            onMouseEnter={item.hasSubmenu ? handleNodeSubmenuHover : undefined}
            onMouseLeave={item.hasSubmenu ? undefined : undefined}
          >
            <Button
              variant="ghost"
              onClick={() => {
                if (!item.hasSubmenu && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
              className={`w-full justify-start px-4 py-2 h-auto ${item.hasSubmenu ? 'cursor-default' : 'cursor-pointer'} ${
                item.label === 'Delete project' ? 'text-destructive hover:text-destructive' : ''
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm flex-1 text-left">{item.label}</span>
              {item.hasSubmenu && (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Node Submenu */}
      {showNodeSubmenu && (
        <div
          data-context-menu
          className="fixed z-50 bg-popover border border-border rounded-lg py-2 w-60"
          style={{
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
          onMouseEnter={() => setShowNodeSubmenu(true)}
        >
          {nodeTypes.map((nodeType, index) => (
            <Button
              key={index}
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (nodeType.onClick) {
                  nodeType.onClick();
                }
                onClose();
              }}
              className="w-full justify-start px-4 py-3 h-auto"
            >
              <nodeType.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{nodeType.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{nodeType.description}</div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </>
  );
}
