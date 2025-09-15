import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';

export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const page = await projectStore.getPage(params.pageId);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}
export async function PUT(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.pageId || !params.projectId) {
      return NextResponse.json({ error: 'Page ID and Project ID are required' }, { status: 400 });
    }
    const { title, content } = await request.json();
    const page = await projectStore.updatePage(params.pageId, title, content);
    
    // Update vector store after page update
    const project = await projectStore.getProject(params.projectId);
    await vectorStore.createOrUpdateProjectIndex(project);
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }
    
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    await projectStore.deletePage(params.pageId);
    // Regenerate vectors after page deletion to remove deleted content
    try {
      console.log('[Delete Page] Regenerating vectors after page deletion...');
      const project = await projectStore.getProject(params.projectId);
      if (project.pages && project.pages.length > 0) {
        await vectorStore.createOrUpdateProjectIndex(project);
        console.log('[Delete Page] Vectors regenerated successfully');
      } else {
        // If no pages left, clear the entire vector index
        console.log('[Delete Page] No pages remaining, clearing vector index...');
        await vectorStore.clearProjectIndex(params.projectId);
        console.log('[Delete Page] Vector index cleared');
      }
    } catch (vectorError) {
      console.error('[Delete Page] Vector store error (non-fatal):', vectorError);
      // Continue without vector store update
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
} 
