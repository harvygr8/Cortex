'use client';

import { memo } from 'react';
import { FileText, Trash2, Unlink } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const TasksContextMenu = memo(({ x, y, onClose, onDelete, onExportTasks, onDetach }) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleClick = (e) => {
    e.stopPropagation();
  };

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed z-50"
      style={{ left: x, top: y }}
      onClick={handleClick}
    >
      <div className={`
        py-2 rounded-lg shadow-lg border
        ${theme.background2} ${theme.border}
        min-w-[160px]
      `}>
        <button
          onClick={() => handleAction(onExportTasks)}
          className={`
            w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2
            ${theme.hover}
            ${theme.text}
          `}
        >
          <FileText className="w-4 h-4" />
          Export Tasks
        </button>
        
        <button
          onClick={() => handleAction(onDetach)}
          className={`
            w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2
            ${theme.hover}
            ${theme.text}
          `}
        >
          <Unlink className="w-4 h-4" />
          Detach from project
        </button>
        
        <div className={`border-t ${theme.border} my-1`} />
        
        <button
          onClick={() => handleAction(onDelete)}
          className={`
            w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2
            ${theme.dangerHover}
            ${theme.danger}
          `}
        >
          <Trash2 className="w-4 h-4" />
          Delete Task List
        </button>
      </div>
    </div>
  );
});

TasksContextMenu.displayName = 'TasksContextMenu';

export default TasksContextMenu;
