import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/projects/[projectId]/images/[imageId]
export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const image = await projectStore.getImage(params.imageId);
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(image);
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
// PUT /api/projects/[projectId]/images/[imageId]
export async function PUT(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }
    const { imageUrl, imageAlt, positionX, positionY, sourceHandle, targetHandle, projectId } = await request.json();
    if (imageUrl !== undefined || imageAlt !== undefined) {
      await projectStore.updateImageData(params.imageId, imageUrl, imageAlt);
    }
    if (positionX !== undefined && positionY !== undefined) {
      await projectStore.updateImagePosition(params.imageId, positionX, positionY);
    }
    if (sourceHandle !== undefined || targetHandle !== undefined) {
      await projectStore.updateImageHandles(params.imageId, sourceHandle, targetHandle);
    }
    if (projectId !== undefined) {
      await projectStore.updateImageProject(params.imageId, projectId);
    }
    const updatedImage = await projectStore.getImage(params.imageId);
    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
// DELETE /api/projects/[projectId]/images/[imageId]
export async function DELETE(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }
    // Get image data before deletion to clean up the file
    const image = await projectStore.getImage(params.imageId);
    if (image && image.image_url && image.image_url.startsWith('/images/')) {
      // Extract filename from URL (e.g., /images/projectId/filename.jpg)
      const urlParts = image.image_url.split('/');
      if (urlParts.length >= 4) {
        const projectId = urlParts[2];
        const filename = urlParts[3];
        const filepath = join(process.cwd(), 'public', 'images', projectId, filename);
        
        // Delete the actual image file
        try {
          if (existsSync(filepath)) {
            await unlink(filepath);
            console.log(`[Image Cleanup] Deleted file: ${filepath}`);
          }
        } catch (fileError) {
          console.warn(`[Image Cleanup] Could not delete file ${filepath}:`, fileError);
          // Continue with database deletion even if file deletion fails
        }
      }
    }
    // Delete from database
    await projectStore.deleteImage(params.imageId);
    return NextResponse.json({ 
      success: true,
      message: 'Image and associated file deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
