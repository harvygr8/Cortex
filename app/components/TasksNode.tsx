'use client';
import React from 'react';

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { ClipboardList, X, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
const TasksNode = memo(({ data, isConnectable, selected }: any) => {
  const { tasksCard, onDelete, onContextMenu, isConnecting } = data;

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

  const handleContextMenu = (e: React.MouseEvent) => {
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
          setTasks((prev: any[]) => [...prev, newTask]);
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

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t: any) => t.id == taskId); // Use == to handle string/number conversion
    if (!task) return;
    
    // Optimistically update UI
    setTasks((prev: any[]) => prev.map((t: any) => 
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
        setTasks((prev: any[]) => prev.map((t: any) => 
          t.id == taskId ? updatedTask : t
        ));
      } else {
        console.error('Failed to update task in database');
        // Revert optimistic update on failure
        setTasks((prev: any[]) => prev.map((t: any) => 
          t.id == taskId ? { ...t, completed: task.completed } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on failure
      setTasks((prev: any[]) => prev.map((t: any) => 
        t.id == taskId ? { ...t, completed: task.completed } : t
      ));
    }
  };

  const deleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find((t: any) => t.id == taskId); // Use == to handle string/number conversion
    if (!taskToDelete) return;
    
    // Optimistically update UI
    setTasks((prev: any[]) => prev.filter((task: any) => task.id != taskId));
    
    // Persist to database
    try {
      const response = await fetch(`/api/projects/${tasksCard.projectId}/task-lists/${tasksCard.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('Failed to delete task from database');
        // Revert optimistic update on failure
        setTasks((prev: any[]) => [...prev, taskToDelete].sort((a: any, b: any) => 
          (a.order_index || 0) - (b.order_index || 0)
        ));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      // Revert optimistic update on failure
      setTasks((prev: any[]) => [...prev, taskToDelete].sort((a: any, b: any) => 
        (a.order_index || 0) - (b.order_index || 0)
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
    // Shift+Enter allows new line (default behavior)
  };

  return (
    <div 
      className="tasks-node relative"
      onContextMenu={handleContextMenu}
      style={{ minWidth: '420px', minHeight: '320px' }}
    >
      <Card className={`
        h-full flex flex-col w-full transition-all duration-200
        border-foreground/25 hover:border-primary/50
        ${selected 
          ? 'ring-2 ring-primary' 
          : 'hover:ring-1 hover:ring-muted'
        }
        ${data.isFlashing ? 'node-flashing' : ''}
      `}>
        {/* Target handles positioned on the card boundaries - only visible when selected */}
        <Handle
          type="target"
          position={Position.Left}
          id="tasks-input-left"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="tasks-input-right"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="tasks-input-top"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="tasks-input-bottom"
          isConnectable={isConnectable}
          style={{ 
            background: 'hsl(var(--primary))',
            width: '12px',
            height: '12px',
            border: '2px solid hsl(var(--background))',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: (selected || isConnecting) ? 1 : 0,
            visibility: (selected || isConnecting) ? 'visible' : 'hidden'
          }}
        />

        {/* Header */}
        <CardHeader className="pb-5 cursor-move">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Tasks
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(tasksCard.id)}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Task List</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden px-6 pt-0 pb-4">
          {/* Task Input */}
          <div className="flex gap-2 items-center mb-6 mt-2">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new task"
              className="flex-1 border-foreground/25 hover:border-primary/50 focus-visible:border-primary/50"
            />
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <p className="text-sm font-medium text-muted-foreground">
                  No tasks yet
                </p>
              </div>
            ) : (
              <div className="-mx-6">
                {tasks.map((task: any, index: number) => (
                  <React.Fragment key={task.id}>
                    <div className="group flex items-center gap-3 py-3 px-6 transition-all">
                      <span 
                        onClick={() => toggleTask(task.id)}
                        className={`flex-1 text-sm cursor-pointer text-foreground ${
                          task.completed ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {task.text}
                      </span>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTask(task.id)}
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Task</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {index < tasks.length - 1 && <Separator className="mx-6" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer with Summary */}
        {tasks.length > 0 && (
          <CardFooter className="pt-5">
            <div className="flex items-center w-full">
              <Badge variant="secondary" className="text-xs">
                {Math.round((tasks.filter((t: any) => t.completed).length / tasks.length) * 100)}%
              </Badge>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
});

TasksNode.displayName = 'TasksNode';

export default TasksNode;

