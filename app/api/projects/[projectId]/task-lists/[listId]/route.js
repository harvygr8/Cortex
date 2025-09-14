import { NextResponse } from 'next/server';
import projectStore from '../../../../../../lib/projectStore';

// GET /api/projects/[projectId]/task-lists/[listId]
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const taskList = await projectStore.getTaskList(params.listId);
    
    if (!taskList) {
      return NextResponse.json(
        { error: 'Task list not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(taskList);
  } catch (error) {
    console.error('Error fetching task list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task list' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId]/task-lists/[listId]
export async function PUT(request, { params }) {
  try {
    await projectStore.initialize();
    const { positionX, positionY, sourceHandle, targetHandle, projectId } = await request.json();
    
    if (positionX !== undefined && positionY !== undefined) {
      await projectStore.updateTaskListPosition(params.listId, positionX, positionY);
    }
    
    if (sourceHandle !== undefined || targetHandle !== undefined) {
      await projectStore.updateTaskListHandles(params.listId, sourceHandle, targetHandle);
    }
    
    if (projectId !== undefined) {
      await projectStore.updateTaskListProject(params.listId, projectId);
    }

    const updatedTaskList = await projectStore.getTaskList(params.listId);
    return NextResponse.json(updatedTaskList);
  } catch (error) {
    console.error('Error updating task list:', error);
    return NextResponse.json(
      { error: 'Failed to update task list' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/task-lists/[listId]
export async function DELETE(request, { params }) {
  try {
    await projectStore.initialize();
    await projectStore.deleteTaskList(params.listId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task list:', error);
    return NextResponse.json(
      { error: 'Failed to delete task list' },
      { status: 500 }
    );
  }
}
