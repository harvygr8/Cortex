import { NextResponse } from 'next/server';
import projectStore from '../../../../../../lib/projectStore';
import vectorStore from '../../../../../../lib/vectorStore';

export async function GET(request, { params }) {
  try {
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

export async function PUT(request, { params }) {
  try {
    await projectStore.initialize();
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

export async function DELETE(request, { params }) {
  try {
    await projectStore.initialize();
    await projectStore.deletePage(params.pageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
} 