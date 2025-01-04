'use client';

import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import useThemeStore from '../../lib/stores/themeStore';
import DeletePageButton from './DeletePageButton';

export default function PageList({ pages, projectId }) {
  const { isDarkMode, theme } = useThemeStore();

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      await fetch(`/api/projects/${projectId}/pages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pages: items.map((item, index) => ({ 
            id: item.id, 
            order_index: index 
          }))
        }),
      });
    } catch (error) {
      console.error('Error reordering pages:', error);
    }
  };

  if (!pages.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${isDarkMode ? theme.dark.background : theme.light.background}`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? theme.dark.text : theme.light.text}`}>
          No pages yet
        </h3>
        <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
          Start by adding your first page.
        </p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="pages">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {pages.map((page, index) => (
              <Draggable key={page.id} draggableId={page.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-4 p-4 rounded-lg ${
                      isDarkMode ? theme.dark.background2 : theme.light.background2
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/projects/${projectId}/pages/${page.id}`}
                        className={`text-lg font-medium ${
                          isDarkMode ? theme.dark.text : theme.light.text
                        } hover:underline`}
                      >
                        {page.title}
                      </Link>
                      <DeletePageButton 
                        pageId={page.id} 
                        projectId={projectId}
                        onPageDeleted={() => window.location.reload()}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
} 