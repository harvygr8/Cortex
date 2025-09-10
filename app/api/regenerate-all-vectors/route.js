import { NextResponse } from 'next/server';
import projectStore from '../../../lib/projectStore';
import vectorStore from '../../../lib/vectorStore';

export async function POST(request) {
  console.log('🚀 [API] Starting vector regeneration for all projects...');
  
  try {
    // Initialize project store
    await projectStore.initialize();
    
    // Get all projects
    const projects = await projectStore.getAllProjects();
    console.log(`📊 [API] Found ${projects.length} projects to process`);
    
    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No projects found to regenerate',
        results: {
          total: 0,
          successful: 0,
          failed: 0,
          errors: []
        }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const results = [];

    // Process each project
    for (const [index, project] of projects.entries()) {
      const projectNum = index + 1;
      const totalProjects = projects.length;
      
      console.log(`📍 [API] [${projectNum}/${totalProjects}] Processing: ${project.title}`);
      
      if (!project.pages || project.pages.length === 0) {
        console.log(`⚠️  [API] Skipping ${project.title} - no content to vectorize`);
        results.push({
          projectId: project.id,
          projectTitle: project.title,
          status: 'skipped',
          reason: 'No content to vectorize',
          pages: 0
        });
        continue;
      }

      try {
        console.log(`🔄 [API] Regenerating vectors for ${project.title}...`);
        const startTime = Date.now();
        
        // Force regenerate vectors for this project
        const result = await vectorStore.forceRegenerateProject(project);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (result) {
          console.log(`✅ [API] Success! ${project.title} completed in ${(duration/1000).toFixed(1)}s`);
          successCount++;
          results.push({
            projectId: project.id,
            projectTitle: project.title,
            status: 'success',
            pages: project.pages.length,
            duration: duration
          });
        } else {
          console.log(`❌ [API] Failed - ${project.title} regeneration returned false`);
          errorCount++;
          const error = {
            projectId: project.id,
            projectTitle: project.title,
            error: 'Regeneration returned false'
          };
          errors.push(error);
          results.push({
            projectId: project.id,
            projectTitle: project.title,
            status: 'failed',
            error: 'Regeneration returned false',
            pages: project.pages.length
          });
        }
      } catch (error) {
        console.log(`❌ [API] Failed - ${project.title}: ${error.message}`);
        errorCount++;
        const errorInfo = {
          projectId: project.id,
          projectTitle: project.title,
          error: error.message
        };
        errors.push(errorInfo);
        results.push({
          projectId: project.id,
          projectTitle: project.title,
          status: 'failed',
          error: error.message,
          pages: project.pages?.length || 0
        });
      }
    }

    // Summary
    console.log('🎯 [API] Regeneration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total: ${projects.length}`);
    
    const success = errorCount === 0;
    const message = success 
      ? `Successfully regenerated vectors for ${successCount} projects with 1200-character chunks`
      : `Completed with ${successCount} successes and ${errorCount} failures`;

    return NextResponse.json({
      success,
      message,
      results: {
        total: projects.length,
        successful: successCount,
        failed: errorCount,
        errors,
        details: results
      }
    });
    
  } catch (error) {
    console.error('💥 [API] Fatal error during regeneration:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to regenerate vectors',
        results: {
          total: 0,
          successful: 0,
          failed: 0,
          errors: [{ error: error.message }]
        }
      },
      { status: 500 }
    );
  }
}

// Configure accepted methods
export const config = {
  api: {
    bodyParser: false,
  },
};
