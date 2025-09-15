import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';

export async function POST(request: NextRequest, { params }: APIRouteParams) {
  const { projectId } = params;
  
  try {
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    console.log(`[API] Regenerating vectors for project ${projectId}`);
    
    // Initialize project store and get project
    await projectStore.initialize();
    const project = await projectStore.getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    // Force regeneration using the new intelligent chunking
    console.log(`[API] Starting vector regeneration with new chunking strategy`);
    const regeneratedVectors = await vectorStore.forceRegenerateProject(project);
    if (!regeneratedVectors) {
      return NextResponse.json(
        { error: 'Failed to regenerate vectors' },
        { status: 500 }
      );
    }
    console.log(`[API] Vector regeneration completed successfully for project ${projectId}`);
    return NextResponse.json({
      success: true,
      message: 'Vectors regenerated successfully!',
      projectId: projectId,
      projectTitle: project.title
    });
  } catch (error) {
    console.error(`[API] Error regenerating vectors for project ${projectId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate vectors' },
      { status: 500 }
    );
  }
}
