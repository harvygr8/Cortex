import { NextResponse } from 'next/server';
import projectStore from '../../../lib/projectStore';
import { readdir, unlink, rmdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    await projectStore.initialize();
    
    const imagesBaseDir = join(process.cwd(), 'public', 'images');
    let deletedFiles = [];
    let deletedDirs = [];
    
    if (!existsSync(imagesBaseDir)) {
      return NextResponse.json({
        success: true,
        message: 'No images directory found',
        deletedFiles: [],
        deletedDirs: []
      });
    }
    
    // Get all project directories
    const projectDirs = await readdir(imagesBaseDir);
    
    for (const projectId of projectDirs) {
      const projectImagesDir = join(imagesBaseDir, projectId);
      
      // Check if project still exists
      const project = await projectStore.getProject(projectId);
      
      if (!project) {
        // Project doesn't exist, delete entire directory
        try {
          const files = await readdir(projectImagesDir);
          for (const file of files) {
            const filepath = join(projectImagesDir, file);
            await unlink(filepath);
            deletedFiles.push(`${projectId}/${file}`);
          }
          await rmdir(projectImagesDir);
          deletedDirs.push(projectId);
          console.log(`[Image Cleanup] Deleted orphaned project directory: ${projectId}`);
        } catch (error) {
          console.warn(`[Image Cleanup] Error cleaning up orphaned project ${projectId}:`, error);
        }
        continue;
      }
      
      // Project exists, check individual image files
      try {
        const files = await readdir(projectImagesDir);
        const imageRecords = await projectStore.getImagesByProject(projectId);
        const dbImageUrls = new Set(
          imageRecords
            .filter(img => img.image_url && img.image_url.startsWith('/images/'))
            .map(img => img.image_url.split('/').pop()) // Get filename from URL
        );
        
        for (const file of files) {
          if (!dbImageUrls.has(file)) {
            // File exists but no database record
            const filepath = join(projectImagesDir, file);
            try {
              await unlink(filepath);
              deletedFiles.push(`${projectId}/${file}`);
              console.log(`[Image Cleanup] Deleted orphaned file: ${projectId}/${file}`);
            } catch (error) {
              console.warn(`[Image Cleanup] Error deleting orphaned file ${filepath}:`, error);
            }
          }
        }
        
        // Check if directory is now empty
        const remainingFiles = await readdir(projectImagesDir);
        if (remainingFiles.length === 0) {
          await rmdir(projectImagesDir);
          deletedDirs.push(projectId);
          console.log(`[Image Cleanup] Removed empty project directory: ${projectId}`);
        }
      } catch (error) {
        console.warn(`[Image Cleanup] Error processing project ${projectId}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedFiles.length} orphaned files and ${deletedDirs.length} empty directories.`,
      deletedFiles,
      deletedDirs
    });
    
  } catch (error) {
    console.error('Error during image cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup orphaned images' },
      { status: 500 }
    );
  }
}
