import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';

// GET /api/projects/[projectId]/task-lists
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const taskLists = await projectStore.getTaskListsByProject(params.projectId);
    return NextResponse.json(taskLists);
  } catch (error) {
    console.error('Error fetching task lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task lists' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/task-lists
export async function POST(request, { params }) {
  try {
    await projectStore.initialize();
    const { title = 'Task List', positionX = 0, positionY = 0, sourceHandle = null, targetHandle = null } = await request.json();

    const taskList = await projectStore.addTaskList(
      params.projectId,
      title,
      positionX,
      positionY,
      sourceHandle,
      targetHandle
    );

    return NextResponse.json(taskList);
  } catch (error) {
    console.error('Error creating task list:', error);
    return NextResponse.json(
      { error: 'Failed to create task list' },
      { status: 500 }
    );
  }
}
