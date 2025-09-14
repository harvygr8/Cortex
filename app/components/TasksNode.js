'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { ClipboardList, Plus, Trash2, Check, X } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';

const TasksNode = memo(({ data, isConnectable, selected }) => {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { tasksCard, onDelete, onContextMenu } = data;

  const [tasks, setTasks] = useState(tasksCard.tasks || []);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load tasks from database when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      if (!tasksCard.id || !tasksCard.projectId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${tasksCard.projectId}/task-lists/${tasksCard.id}`);
        if (response.ok) {
          const taskList = await response.json();
          setTasks(taskList.tasks || []);
        } else if (response.status === 404) {
          // Task list doesn't exist in database yet, create it
          const createResponse = await fetch(`/api/projects/${tasksCard.projectId}/task-lists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Task List',
              positionX: 0,
              positionY: 0
            }),
          });
          
          if (createResponse.ok) {
            const newTaskList = await createResponse.json();
            // Don't mutate tasksCard directly - let parent component handle ID updates
          }
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [tasksCard.id, tasksCard.projectId]);

  const handleContextMenu = (e) => {
    console.log('TasksNode context menu triggered', { onContextMenu, tasksCard });
    if (onContextMenu) {
      onContextMenu(e, tasksCard);
    }
  };

  const addTask = async () => {
    if (newTask.trim()) {
      const taskText = newTask.trim();
      setNewTask('');
      
      // Persist to database first, then update UI with real data
      try {
        const response = await fetch(`/api/projects/${tasksCard.projectId}/task-lists/${tasksCard.id}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: taskText,
            orderIndex: tasks.length
          }),
        });
        
        if (response.ok) {
          const newTask = await response.json();
          setTasks(prev => [...prev, newTask]);
        } else {
          console.error('Failed to save task to database');
          // Restore the input text on failure
          setNewTask(taskText);
        }
      } catch (error) {
        console.error('Error saving task:', error);
        // Restore the input text on failure
        setNewTask(taskText);
      }
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id == taskId); // Use == to handle string/number conversion
    if (!task) return;
    
    // Optimistically update UI
    setTasks(prev => prev.map(t => 
      t.id == taskId ? { ...t, completed: !t.completed } : t
    ));
    
    // Persist to database
    try {
      const response = await fetch(`/api/projects/${tasksCard.projectId}/task-lists/${tasksCard.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed
        }),
      });
      
      if (response.ok) {
        const updatedTask = await response.json();
        // Update with the response data to ensure consistency
        setTasks(prev => prev.map(t => 
          t.id == taskId ? updatedTask : t
        ));
      } else {
        console.error('Failed to update task in database');
        // Revert optimistic update on failure
        setTasks(prev => prev.map(t => 
          t.id == taskId ? { ...t, completed: task.completed } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on failure
      setTasks(prev => prev.map(t => 
        t.id == taskId ? { ...t, completed: task.completed } : t
      ));
    }
  };

  const deleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id == taskId); // Use == to handle string/number conversion
    if (!taskToDelete) return;
    
    // Optimistically update UI
    setTasks(prev => prev.filter(task => task.id != taskId));
    
    // Persist to database
    try {
      const response = await fetch(`/api/projects/${tasksCard.projectId}/task-lists/${tasksCard.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('Failed to delete task from database');
        // Revert optimistic update on failure
        setTasks(prev => [...prev, taskToDelete].sort((a, b) => 
          (a.order_index || 0) - (b.order_index || 0)
        ));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      // Revert optimistic update on failure
      setTasks(prev => [...prev, taskToDelete].sort((a, b) => 
        (a.order_index || 0) - (b.order_index || 0)
      ));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <div 
      className="tasks-node relative"
      onContextMenu={handleContextMenu}
      style={{ minWidth: '420px', minHeight: '320px' }}
    >
      <div className={`
        p-4 rounded-lg shadow-md transition-all
        h-full flex flex-col w-full relative
        ${theme.background2}
        border-2 ${selected 
          ? 'border-blue-500 ring-2 ring-blue-300/50' 
          : theme.border
        }
      `}>
        {/* Target handles positioned on the card boundaries */}
        <Handle
          type="target"
          position={Position.Left}
          id="tasks-input-left"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="tasks-input-right"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="tasks-input-top"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="tasks-input-bottom"
          isConnectable={isConnectable}
          style={{ 
            background: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* Tasks Header */}
        <div className="flex justify-between items-start mb-4 cursor-move">
          <h3 className={`text-lg font-semibold ${theme.font?.heading || 'font-ibm-plex-sans'} line-clamp-1 ${theme.text} flex items-center gap-2`}>
            <ClipboardList className={`w-4 h-4 ${theme.accent}`} />
            Tasks
          </h3>
          <button
            onClick={() => onDelete(tasksCard.id)}
            className={`text-sm ${theme.secondary} hover:text-red-500 transition-colors`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Task Input Section */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              className={`flex-1 px-3 py-2 rounded text-sm border ${theme.input} focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent`}
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className={`px-3 py-2 rounded text-sm font-medium ${theme.button} disabled:opacity-50 hover:opacity-80 transition-opacity flex items-center gap-1`}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        {/* Tasks List Section */}
        <div className="flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ClipboardList className={`w-8 h-8 ${theme.secondary} mb-2`} />
              <p className={`text-sm ${theme.secondary}`}>
                No tasks yet. Add your first task above!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-2 rounded border transition-all ${
                    task.completed 
                      ? `${theme.background} ${theme.border} opacity-100` 
                      : `${theme.background} ${theme.border} ${theme.hover}`
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? `${theme.statusIndicator} text-white`
                        : `${theme.border} ${theme.hover}`
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </button>
                  
                  <span className={`flex-1 text-sm ${
                    task.completed 
                      ? `${theme.secondary} line-through` 
                      : theme.text
                  }`}>
                    {task.text}
                  </span>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      theme.secondary
                    } hover:text-red-500`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Summary */}
        {tasks.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${theme.border}`}>
            <div className="flex justify-between items-center text-xs">
              <span className={theme.secondary}>
                {tasks.filter(t => t.completed).length} of {tasks.length} completed
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TasksNode.displayName = 'TasksNode';

export default TasksNode;

