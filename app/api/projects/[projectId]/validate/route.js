import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';
import vectorStore from '../../../../../lib/vectorStore';

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

    // Validate data consistency between SQLite and FAISS
    const validation = await vectorStore.validateDataConsistency(params.projectId);
    
    return NextResponse.json({
      projectId: params.projectId,
      projectTitle: project.title,
      validation: validation,
      message: 'Data consistency validation completed'
    });
  } catch (error) {
    console.error('Error validating data consistency:', error);
    return NextResponse.json(
      { error: 'Failed to validate data consistency' },
      { status: 500 }
    );
  }
}
