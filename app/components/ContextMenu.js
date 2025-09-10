'use client';

import { useEffect, useRef } from 'react';
import { FaComments, FaEdit, FaTrash, FaPlus, FaUpload, FaSync } from 'react-icons/fa';
import useThemeStore from '../../lib/stores/themeStore';

export default function ContextMenu({ x, y, onClose, onChat, onEdit, onDelete, onAddPage, onImportData, onRegenerateVectors }) {
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
      icon: FaComments,
      label: 'Chat with project',
      onClick: onChat,
      color: theme.accent
    },
    {
      icon: FaPlus,
      label: 'Add page',
      onClick: onAddPage,
      color: theme.text
    },
    {
      icon: FaUpload,
      label: 'Import page',
      onClick: onImportData,
      color: theme.text
    },
    {
      icon: FaSync,
      label: 'Regenerate vectors',
      onClick: onRegenerateVectors,
      color: theme.text
    },
    {
      icon: FaEdit,
      label: 'Edit project',
      onClick: onEdit,
      color: theme.text
    },
    {
      icon: FaTrash,
      label: 'Delete project',
      onClick: onDelete,
      color: 'text-red-500'
    }
  ];

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 ${theme.background2} border border-gray-200/30 rounded-lg shadow-lg py-2 min-w-48`}
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
