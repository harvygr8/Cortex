import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';

// GET /api/projects/[projectId]/scratchpads
export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const scratchpads = await projectStore.getScratchpadsByProject(params.projectId);
    return NextResponse.json(scratchpads);
  } catch (error) {
    console.error('Error fetching scratchpads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scratchpads' },
      { status: 500 }
    );
  }
}
// POST /api/projects/[projectId]/scratchpads
export async function POST(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const { text = '', positionX = 0, positionY = 0, sourceHandle = null, targetHandle = null } = await request.json();
    const scratchpad = await projectStore.addScratchpad(
      params.projectId,
      text,
      positionX,
      positionY,
      sourceHandle,
      targetHandle
    );
    return NextResponse.json(scratchpad);
  } catch (error) {
    console.error('Error creating scratchpad:', error);
    return NextResponse.json(
      { error: 'Failed to create scratchpad' },
      { status: 500 }
    );
  }
}
