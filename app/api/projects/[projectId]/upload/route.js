import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';
import { processDocument } from '../../../../../lib/utils/markdownProcessor';

export async function POST(request, { params }) {
  console.log('Upload route hit - processing document');
  console.log('Project ID:', params.projectId);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    console.log('File received:', file?.name);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Process the document
    const processedDoc = await processDocument(file);
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
    
    return NextResponse.json({
      success: true,
      page: page,
      projectId: params.projectId
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// Configure accepted methods
export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
}; 