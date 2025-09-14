'use client';

import { useEffect, useRef } from 'react';
import { Trash2, Copy, Download, Unlink } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

export default function ChatContextMenu({ 
  x, 
  y, 
  onClose, 
  onDelete, 
  onCopyResponse, 
  onExportToFile,
  onDetach
}) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const menuRef = useRef(null);

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

  const menuItems = [
    {
      icon: Copy,
      label: 'Copy response',
      onClick: onCopyResponse,
      color: theme.text
    },
    {
      icon: Download,
      label: 'Export to file',
      onClick: onExportToFile,
      color: theme.text
    },
    {
      icon: Unlink,
      label: 'Detach from project',
      onClick: onDetach,
      color: theme.text
    },
    {
      icon: Trash2,
      label: 'Delete chat',
      onClick: onDelete,
      color: theme.danger
    }
  ];

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 ${theme.background2} border ${theme.border} rounded-lg shadow-lg py-2 min-w-48`}
      style={{
        left: x,
        top: y,
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors`}
        >
          <item.icon className={`w-4 h-4 ${item.color}`} />
          <span className={`text-sm ${theme.text}`}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
