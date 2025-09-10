import { NextResponse } from 'next/server';
import vectorStore from '../../../../lib/vectorStore';
import projectStore from '../../../../lib/projectStore';

export async function POST(request) {
  try {
    const { clearAll = false, projectId = null, forceRegenerate = false } = await request.json();
    
    if (clearAll) {
      console.log('[API] Clearing all vector stores...');
      await vectorStore.clearAllVectorStores();
      return NextResponse.json({ 
        message: 'All vector stores cleared successfully',
        cleared: true
      });
    }
    
    if (forceRegenerate && projectId) {
      console.log(`[API] Force regenerating vectors for project ${projectId}...`);
      await projectStore.initialize();
      const project = await projectStore.getProject(projectId);
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      
      const result = await vectorStore.forceRegenerateProject(project);
      return NextResponse.json({ 
        message: result ? 'Project vectors regenerated successfully' : 'Failed to regenerate vectors',
        success: !!result
      });
    }
    
    return NextResponse.json({ 
      message: 'Vector store service ready',
      cleared: false
    });
  } catch (error) {
    console.error('Error with vector store operations:', error);
    return NextResponse.json(
      { error: 'Failed to perform vector store operations' },
      { status: 500 }
    );
  }
} 