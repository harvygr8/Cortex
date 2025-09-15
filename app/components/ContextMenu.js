'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Edit, Trash2, Plus, Upload, RotateCcw, ClipboardList, FileText, Image as ImageIcon, ChevronRight, StickyNote, Box } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function ContextMenu({ x, y, onClose, onChat, onEdit, onDelete, onAddPage, onImportData, onRegenerateVectors, onCreateTasks, onCreateScratchpad, onCreateImage, onCreateContainer }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const menuRef = useRef(null);
  const [showNodeSubmenu, setShowNodeSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
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

  const handleNodeSubmenuHover = (event) => {
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
      icon: MessageSquare,
      label: 'Q&A Node',
      onClick: onChat,
      color: theme.accent,
      description: 'Ask questions about your project'
    },
    {
      icon: ClipboardList,
      label: 'Tasks Node',
      onClick: onCreateTasks,
      color: theme.accent,
      description: 'Create and manage task lists'
    },
    {
      icon: StickyNote,
      label: 'Scratchpad Node',
      onClick: onCreateScratchpad,
      color: theme.accent,
      description: 'Write notes and thoughts'
    },
    {
      icon: ImageIcon,
      label: 'Image Node',
      onClick: onCreateImage,
      color: theme.accent,
      description: 'Display images and visuals'
    }
  ];

  const menuItems = [
    {
      icon: Plus,
      label: 'Add Node',
      hasSubmenu: true,
      color: theme.accent
    },
    {
      icon: Box,
      label: 'Add Container',
      onClick: onCreateContainer,
      color: theme.accent
    },
    {
      icon: FileText,
      label: 'Add page',
      onClick: onAddPage,
      color: theme.text
    },
    {
      icon: Upload,
      label: 'Import page',
      onClick: onImportData,
      color: theme.text
    },
    {
      icon: RotateCcw,
      label: 'Regenerate vectors',
      onClick: onRegenerateVectors,
      color: theme.text
    },
    {
      icon: Edit,
      label: 'Edit project',
      onClick: onEdit,
      color: theme.text
    },
    {
      icon: Trash2,
      label: 'Delete project',
      onClick: onDelete,
      color: theme.danger
    }
  ];

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed z-50 ${theme.background2} border ${theme.border} rounded-lg shadow-lg py-2 min-w-48`}
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
            <button
              onClick={() => {
                if (!item.hasSubmenu && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
              className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors ${item.hasSubmenu ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className={`text-sm ${theme.text} flex-1`}>{item.label}</span>
              {item.hasSubmenu && (
                <ChevronRight className={`w-3 h-3 ${theme.secondary}`} />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Node Submenu */}
      {showNodeSubmenu && (
        <div
          className={`fixed z-50 ${theme.background2} border ${theme.border} rounded-lg shadow-lg py-2 min-w-56`}
          style={{
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
          onMouseEnter={() => setShowNodeSubmenu(true)}
        >
          {nodeTypes.map((nodeType, index) => (
            <button
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nodeType.onClick();
                onClose();
              }}
              className={`w-full px-4 py-3 text-left flex items-start gap-3 ${theme.hover} transition-colors cursor-pointer`}
            >
              <nodeType.icon className={`w-4 h-4 ${nodeType.color} mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <div className={`text-sm font-medium ${theme.text}`}>{nodeType.label}</div>
                <div className={`text-xs ${theme.secondary} mt-0.5`}>{nodeType.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
