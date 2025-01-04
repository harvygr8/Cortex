import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';
import vectorStore from '../../../../../lib/vectorStore';

export async function POST(request, { params }) {
  try {
    await projectStore.initialize();
    const { title } = await request.json();
    const page = await projectStore.addPage(params.projectId, title);
    
    if (!page) {
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }
    
    try {
      // Get project and update vectors
      const project = await projectStore.getProject(params.projectId);
      if (project.pages && project.pages.length > 0) {
        await vectorStore.createOrUpdateProjectIndex(project);
      }
    } catch (vectorError) {
      console.error('Vector store error (non-fatal):', vectorError);
      // Continue without vector store update
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

export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
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