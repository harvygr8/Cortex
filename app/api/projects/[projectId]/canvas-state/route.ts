import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';

// GET /api/projects/[projectId]/canvas-state
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const canvasState = await projectStore.getCanvasState(params.projectId);
    return NextResponse.json(canvasState || { nodes_data: [], edges_data: [], viewport_data: {} });
  } catch (error) {
    console.error('Error fetching canvas state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canvas state' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/canvas-state
export async function POST(request, { params }) {
  try {
    await projectStore.initialize();
    const { nodes_data, edges_data, viewport_data } = await request.json();

    await projectStore.saveCanvasState(
      params.projectId,
      nodes_data || [],
      edges_data || [],
      viewport_data || {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving canvas state:', error);
    return NextResponse.json(
      { error: 'Failed to save canvas state' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/canvas-state
export async function DELETE(request, { params }) {
  try {
    await projectStore.initialize();
    await projectStore.deleteCanvasState(params.projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting canvas state:', error);
    return NextResponse.json(
      { error: 'Failed to delete canvas state' },
      { status: 500 }
    );
  }
}
