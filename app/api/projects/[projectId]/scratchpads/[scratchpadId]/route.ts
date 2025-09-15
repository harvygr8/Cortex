import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';

// GET /api/projects/[projectId]/scratchpads/[scratchpadId]
export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.scratchpadId) {
      return NextResponse.json({ error: 'Scratchpad ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const scratchpad = await projectStore.getScratchpad(params.scratchpadId);
    
    if (!scratchpad) {
      return NextResponse.json(
        { error: 'Scratchpad not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(scratchpad);
  } catch (error) {
    console.error('Error fetching scratchpad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scratchpad' },
      { status: 500 }
    );
  }
}
// PUT /api/projects/[projectId]/scratchpads/[scratchpadId]
export async function PUT(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.scratchpadId) {
      return NextResponse.json({ error: 'Scratchpad ID is required' }, { status: 400 });
    }
    const { text, positionX, positionY, sourceHandle, targetHandle, projectId } = await request.json();
    if (text !== undefined) {
      await projectStore.updateScratchpadText(params.scratchpadId, text);
    }
    if (positionX !== undefined && positionY !== undefined) {
      await projectStore.updateScratchpadPosition(params.scratchpadId, positionX, positionY);
    }
    if (sourceHandle !== undefined || targetHandle !== undefined) {
      await projectStore.updateScratchpadHandles(params.scratchpadId, sourceHandle, targetHandle);
    }
    if (projectId !== undefined) {
      await projectStore.updateScratchpadProject(params.scratchpadId, projectId);
    }
    const updatedScratchpad = await projectStore.getScratchpad(params.scratchpadId);
    return NextResponse.json(updatedScratchpad);
  } catch (error) {
    console.error('Error updating scratchpad:', error);
    return NextResponse.json(
      { error: 'Failed to update scratchpad' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/scratchpads/[scratchpadId]
export async function DELETE(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.scratchpadId) {
      return NextResponse.json({ error: 'Scratchpad ID is required' }, { status: 400 });
    }
    await projectStore.deleteScratchpad(params.scratchpadId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scratchpad:', error);
    return NextResponse.json(
      { error: 'Failed to delete scratchpad' },
      { status: 500 }
    );
  }
}
