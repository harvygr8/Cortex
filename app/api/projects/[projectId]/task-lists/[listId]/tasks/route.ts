import { NextResponse } from 'next/server';
import projectStore from '../../../../../../../lib/projectStore';

// GET /api/projects/[projectId]/task-lists/[listId]/tasks
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const tasks = await projectStore.getTasksByList(params.listId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/task-lists/[listId]/tasks
export async function POST(request, { params }) {
  try {
    await projectStore.initialize();
    const { text, orderIndex = 0 } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Task text is required' },
        { status: 400 }
      );
    }

    const task = await projectStore.addTask(params.listId, text, orderIndex);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
