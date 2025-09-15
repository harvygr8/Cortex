import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';
import vectorStore from '@/lib/vectorStore';

export async function POST(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    const { query, k = 5, weights = { semantic: 0.7, keyword: 0.3 } } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    await projectStore.initialize();
    const project = await projectStore.getProject(params.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    // Test hybrid search
    console.log(`[Test API] Testing hybrid search for query: "${query}"`);
    const hybridResults = await vectorStore.hybridSearch(params.projectId, query, k, weights);
    // For comparison, also test semantic-only search
    const vectorStoreInstance = await vectorStore.loadProjectIndex(params.projectId);
    const semanticResults = vectorStoreInstance ? await vectorStoreInstance.similaritySearch(query, k) : [];
    // Format results for comparison
    const formatResults = (results: any, type: any) => results.map((doc: any, index: any) => ({
      rank: index + 1,
      type: type,
      score: doc.hybridScore || `rank_${index + 1}`,
      source: doc.source || 'semantic',
      pageTitle: doc.metadata.pageTitle,
      content: doc.pageContent.substring(0, 150) + '...',
      metadata: doc.metadata
    }));
    const comparison = {
      query,
      weights,
      hybridResults: formatResults(hybridResults, 'hybrid'),
      semanticResults: formatResults(semanticResults, 'semantic'),
      summary: {
        hybridCount: hybridResults.length,
        semanticCount: semanticResults.length,
        hybridRetrieverStats: vectorStore.getHybridRetrieverStats(params.projectId)
      }
    };
    console.log(`[Test API] Hybrid search completed. Results:`, comparison.summary);
    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error testing hybrid search:', error);
    return NextResponse.json(
      { error: 'Failed to test hybrid search', details: (error as any).message },
      { status: 500 }
    );
  }
}
