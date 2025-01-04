import { NextResponse } from 'next/server';
import projectStore from '../../../../lib/projectStore';
import vectorStore from '../../../../lib/vectorStore';

export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const project = await projectStore.getProject(params.projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await projectStore.initialize();
    await projectStore.deleteProject(params.projectId);
    
    // Clean up vector store
    try {
      await vectorStore.deleteProjectIndex(params.projectId);
    } catch (vectorError) {
      console.error('Vector store cleanup error (non-fatal):', vectorError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await projectStore.initialize();
    const { title, description } = await request.json();
    const project = await projectStore.updateProject(params.projectId, title, description);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
} 