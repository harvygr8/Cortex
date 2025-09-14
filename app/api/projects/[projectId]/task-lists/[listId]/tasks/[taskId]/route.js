import { NextResponse } from 'next/server';
import projectStore from '../../../../../../../../lib/projectStore';

// GET /api/projects/[projectId]/task-lists/[listId]/tasks/[taskId]
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const task = await projectStore.getTask(params.taskId);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId]/task-lists/[listId]/tasks/[taskId]
export async function PUT(request, { params }) {
  try {
    await projectStore.initialize();
    const { text, completed, orderIndex } = await request.json();
    
    const task = await projectStore.getTask(params.taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const updates = {};
    if (text !== undefined) updates.text = text;
    if (completed !== undefined) updates.completed = completed;
    if (orderIndex !== undefined) updates.order_index = orderIndex;
    
    await projectStore.updateTask(params.taskId, updates);

    const updatedTask = await projectStore.getTask(params.taskId);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/task-lists/[listId]/tasks/[taskId]
export async function DELETE(request, { params }) {
  try {
    await projectStore.initialize();
    await projectStore.deleteTask(params.taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
