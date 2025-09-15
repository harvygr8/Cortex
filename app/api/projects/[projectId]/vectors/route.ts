import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';

export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    await projectStore.initialize();
    const project = await projectStore.getProject(params.projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    // Get hybrid retriever statistics
    const hybridStats = vectorStore.getHybridRetrieverStats(params.projectId);
    return NextResponse.json({
      projectId: params.projectId,
      projectTitle: project.title,
      hybridRetriever: hybridStats,
      message: 'Hybrid retriever statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching hybrid retriever stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hybrid retriever statistics' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const project = await projectStore.getProject(params.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    await vectorStore.createOrUpdateProjectIndex(project);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing vectors:', error);
    return NextResponse.json(
      { error: 'Failed to initialize vectors' },
      { status: 500 }
    );
  }
} 
export async function PUT(request: NextRequest, { params }: APIRouteParams) {
  try {
    const { action } = await request.json();
    if (action === 'reinitialize-hybrid') {
      console.log(`[API] Force reinitializing hybrid retriever for project ${params.projectId}`);
      
      const success = await vectorStore.forceReinitializeHybridRetriever(params.projectId!);
      if (success) {
        return NextResponse.json({ 
          message: 'Hybrid retriever reinitialized successfully',
          success: true
        });
      } else {
        return NextResponse.json({
          error: 'Failed to reinitialize hybrid retriever',
          success: false
        }, { status: 500 });
      }
    }
    return NextResponse.json({ 
      error: 'Invalid action',
      success: false
    }, { status: 400 });
  } catch (error) {
    console.error('Error reinitializing hybrid retriever:', error);
    return NextResponse.json(
      { error: 'Failed to reinitialize hybrid retriever', details: (error as any).message },
      { status: 500 }
    );
  }
}
