'use client';

import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useThemeStore from '../../lib/stores/themeStore';

export default function ChapterList({ chapters, projectId }) {
  const { isDarkMode, theme } = useThemeStore();

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      await fetch(`/api/projects/${projectId}/chapters/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chapters: items.map((item, index) => ({ 
            id: item.id, 
            order_index: index 
          }))
        }),
      });
    } catch (error) {
      console.error('Error reordering chapters:', error);
    }
  };

  if (!chapters.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${isDarkMode ? theme.dark.background : theme.light.background}`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? theme.dark.text : theme.light.text}`}>
          No chapters yet
        </h3>
        <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
          Start by adding your first chapter.
        </p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chapters">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {chapters.map((chapter, index) => (
              <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      isDarkMode ? theme.dark.background2 : theme.light.background2
                    }`}
                  >
                    <Link href={`/projects/${projectId}/chapters/${chapter.id}`}>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? theme.dark.text : theme.light.text}`}>
                        {chapter.title}
                      </h3>
                      <p className={`mt-2 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
                        {chapter.pages?.length || 0} pages
                      </p>
                    </Link>
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