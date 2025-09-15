import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';

export async function POST(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const { title } = await request.json();
    const page = await projectStore.addPage(params.projectId, title);
    
    if (!page) {
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }
    let vectorGenerationSuccess = false;
    try {
      // Get project and update vectors
      const project = await projectStore.getProject(params.projectId);
      if (project.pages && project.pages.length > 0) {
        await vectorStore.createOrUpdateProjectIndex(project);
        vectorGenerationSuccess = true;
      }
    } catch (vectorError) {
      console.error('Vector store error:', vectorError);
      console.error('Vector generation failed - page saved to SQLite but search may be limited');
      // Continue without vector store update - page is still saved in SQLite
    }
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const pages = await projectStore.getProjectPages(params.projectId);
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
} 
