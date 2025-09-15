import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';
import { rmdir, unlink, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Clean up project images directory
    const projectImagesDir = join(process.cwd(), 'public', 'images', params.projectId);
    try {
      if (existsSync(projectImagesDir)) {
        // Read all files in the directory
        const files = await readdir(projectImagesDir);
        
        // Delete all image files
        for (const file of files) {
          const filepath = join(projectImagesDir, file);
          try {
            await unlink(filepath);
            console.log(`[Project Cleanup] Deleted image file: ${filepath}`);
          } catch (fileError) {
            console.warn(`[Project Cleanup] Could not delete file ${filepath}:`, fileError);
          }
        }
        // Remove the empty directory
        await rmdir(projectImagesDir);
        console.log(`[Project Cleanup] Removed project images directory: ${projectImagesDir}`);
      }
    } catch (dirError) {
      console.warn(`[Project Cleanup] Could not clean up images directory for project ${params.projectId}:`, dirError);
      // Continue with project deletion even if image cleanup fails
    }
    // Delete project from database (this will cascade delete related data)
    await projectStore.deleteProject(params.projectId);
    // Clean up vector store
    try {
      await vectorStore.clearProjectIndex(params.projectId);
    } catch (vectorError) {
      console.error('Vector store cleanup error (non-fatal):', vectorError);
    }
    return NextResponse.json({ 
      success: true,
      message: 'Project and all associated files deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest, { params }: APIRouteParams) {
  try {
    const body = await request.json();
    // Handle position updates separately from metadata updates
    if (body.positionX !== undefined && body.positionY !== undefined) {
      if (!params.projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
      }
      await projectStore.updateProjectPosition(params.projectId, body.positionX, body.positionY);
      return NextResponse.json({ success: true });
    }
    // Handle metadata updates (title, description)
    const { title, description } = body;
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const project = await projectStore.updateProject(params.projectId, title, description);
    // Regenerate vectors after project update
    try {
      console.log('[Project Update] Regenerating vectors after project metadata change...');
      if (project.pages && project.pages.length > 0) {
        await vectorStore.createOrUpdateProjectIndex(project);
        console.log('[Project Update] Vectors regenerated successfully');
      }
    } catch (vectorError) {
      console.error('[Project Update] Vector store error (non-fatal):', vectorError);
      // Continue without vector store update
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
} 
