import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';
import { processDocument } from '../../../../../lib/utils/markdownProcessor';

export async function POST(request: NextRequest, { params }: APIRouteParams) {
  console.log('Upload route hit - processing document');
  console.log('Project ID:', params.projectId);
  
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    console.log('File received:', (file as any)?.name);
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    // Process the document
    const processedDoc = await processDocument(file as File);
    console.log('Document processed:', processedDoc.title);
    // Initialize project store and get project
    await projectStore.initialize();
    const project = await projectStore.getProject(params.projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    // Create new page with processed content
    const page = await projectStore.addPage(
      params.projectId,
      processedDoc.title,
      processedDoc.content
    );
    console.log('Page created:', page?.id);
    // Generate vectors after page creation
    let vectorGenerationSuccess = false;
    try {
      console.log('[Upload] Generating vectors for uploaded content...');
      const project = await projectStore.getProject(params.projectId);
      if (project.pages && project.pages.length > 0) {
        await vectorStore.createOrUpdateProjectIndex(project);
        console.log('[Upload] Vectors generated successfully');
        vectorGenerationSuccess = true;
      }
    } catch (vectorError) {
      console.error('[Upload] Vector store error:', vectorError);
      console.error('[Upload] Vector generation failed - content saved to SQLite but search may be limited');
      // Continue without vector store update - content is still saved in SQLite
    }
    
    return NextResponse.json({
      success: true,
      page: page,
      projectId: params.projectId,
      vectorGenerationSuccess: vectorGenerationSuccess,
      message: vectorGenerationSuccess 
        ? 'Document uploaded and indexed successfully' 
        : 'Document uploaded successfully, but vector indexing failed. Content is available but search may be limited.'
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: (error as any).message || 'Failed to process upload' },
      { status: 500 }
    );
  }
}
