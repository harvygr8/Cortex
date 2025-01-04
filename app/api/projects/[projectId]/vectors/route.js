import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';
import vectorStore from '../../../../../lib/vectorStore';

export async function POST(request, { params }) {
  try {
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