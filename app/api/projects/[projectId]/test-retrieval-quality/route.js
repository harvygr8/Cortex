import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';
import vectorStore from '../../../../../lib/vectorStore';
import { ContextAgent } from '../../../../../lib/contextAgent';

export async function POST(request, { params }) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    console.log(`[TestRetrievalQuality] Testing retrieval for query: "${query}"`);
    console.log(`[TestRetrievalQuality] Project ID: ${params.projectId}`);
    
    await projectStore.initialize();
    const project = await projectStore.getProject(params.projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Test 1: Direct hybrid search
    console.log('\n🔍 [TestRetrievalQuality] Testing direct hybrid search...');
    const hybridResults = await vectorStore.hybridSearch(params.projectId, query, 10);
    
    // Test 2: Individual retrieval methods
    console.log('\n🧠 [TestRetrievalQuality] Testing semantic search only...');
    const projectVectors = await vectorStore.loadProjectIndex(params.projectId);
    const semanticResults = projectVectors ? await projectVectors.similaritySearch(query, 10) : [];
    
    console.log('\n🔍 [TestRetrievalQuality] Testing BM25 search only...');
    const hybridRetriever = vectorStore.hybridRetrievers.get(params.projectId);
    let bm25Results = [];
    if (hybridRetriever && hybridRetriever.bm25Retriever) {
      try {
        bm25Results = await hybridRetriever.bm25Retriever.getRelevantDocuments(query, 10);
      } catch (error) {
        console.error('[TestRetrievalQuality] BM25 search failed:', error);
      }
    }
    
    // Test 3: Full context agent processing
    console.log('\n🤖 [TestRetrievalQuality] Testing full context agent...');
    const agent = await ContextAgent.initialize();
    const agentResponse = await agent.processProjectQuestion(params.projectId, query);
    
    // Analyze results quality
    const analysis = {
      query: query,
      project: {
        id: params.projectId,
        title: project.title,
        totalPages: project.pages?.length || 0
      },
      hybridSearch: {
        resultCount: hybridResults.length,
        results: hybridResults.map((result, index) => ({
          rank: index + 1,
          pageTitle: result.metadata?.pageTitle || 'Unknown',
          hybridScore: result.hybridScore?.toFixed(4) || 'N/A',
          source: result.source || 'unknown',
          contentPreview: result.pageContent?.substring(0, 150) + '...' || 'No content',
          hasFullContent: !!result.fullContent,
          contentLength: result.fullContent?.length || result.pageContent?.length || 0
        }))
      },
      semanticOnly: {
        resultCount: semanticResults.length,
        results: semanticResults.slice(0, 5).map((result, index) => ({
          rank: index + 1,
          pageTitle: result.metadata?.pageTitle || 'Unknown',
          contentPreview: result.pageContent?.substring(0, 150) + '...' || 'No content'
        }))
      },
      bm25Only: {
        resultCount: bm25Results.length,
        results: bm25Results.slice(0, 5).map((result, index) => ({
          rank: index + 1,
          pageTitle: result.metadata?.pageTitle || 'Unknown',
          bm25Score: result.score?.toFixed(4) || 'N/A',
          contentPreview: result.pageContent?.substring(0, 150) + '...' || 'No content'
        }))
      },
      agentResponse: {
        hasAnswer: !!agentResponse.answer,
        answerLength: agentResponse.answer?.length || 0,
        answerPreview: agentResponse.answer?.substring(0, 200) + '...' || 'No answer',
        sourcesCount: agentResponse.widgets?.sources?.length || 0
      },
      qualityMetrics: {
        hybridVsSemanticOverlap: calculateOverlap(hybridResults, semanticResults),
        hybridVsBM25Overlap: calculateOverlap(hybridResults, bm25Results),
        uniqueHybridResults: hybridResults.filter(r => r.source === 'hybrid').length,
        semanticOnlyResults: hybridResults.filter(r => r.source === 'semantic').length,
        keywordOnlyResults: hybridResults.filter(r => r.source === 'keyword').length
      }
    };
    
    console.log('\n📊 [TestRetrievalQuality] Quality Analysis:');
    console.log(`  Hybrid results: ${analysis.hybridSearch.resultCount}`);
    console.log(`  Semantic results: ${analysis.semanticOnly.resultCount}`);
    console.log(`  BM25 results: ${analysis.bm25Only.resultCount}`);
    console.log(`  Agent answer: ${analysis.agentResponse.hasAnswer ? 'Generated' : 'Failed'}`);
    console.log(`  Hybrid-Semantic overlap: ${analysis.qualityMetrics.hybridVsSemanticOverlap}%`);
    console.log(`  Hybrid-BM25 overlap: ${analysis.qualityMetrics.hybridVsBM25Overlap}%`);
    
    return NextResponse.json({
      success: true,
      analysis: analysis,
      recommendations: generateRecommendations(analysis)
    });
    
  } catch (error) {
    console.error('[TestRetrievalQuality] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test retrieval quality', details: error.message },
      { status: 500 }
    );
  }
}

function calculateOverlap(results1, results2) {
  if (results1.length === 0 || results2.length === 0) return 0;
  
  const pageIds1 = new Set(results1.map(r => r.metadata?.pageId).filter(id => id));
  const pageIds2 = new Set(results2.map(r => r.metadata?.pageId).filter(id => id));
  
  const intersection = new Set([...pageIds1].filter(id => pageIds2.has(id)));
  return Math.round((intersection.size / Math.max(pageIds1.size, pageIds2.size)) * 100);
}

function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.hybridSearch.resultCount === 0) {
    recommendations.push({
      issue: "No hybrid search results",
      severity: "high",
      solution: "Check vector store initialization and BM25 setup"
    });
  }
  
  if (analysis.qualityMetrics.hybridVsSemanticOverlap < 30) {
    recommendations.push({
      issue: "Low overlap between hybrid and semantic results",
      severity: "medium", 
      solution: "Adjust hybrid search weights or improve BM25 scoring"
    });
  }
  
  if (analysis.bm25Only.resultCount === 0) {
    recommendations.push({
      issue: "BM25 search returning no results",
      severity: "high",
      solution: "Check BM25 initialization and document content loading"
    });
  }
  
  if (!analysis.agentResponse.hasAnswer) {
    recommendations.push({
      issue: "Agent failed to generate answer",
      severity: "high",
      solution: "Check context assembly and LLM integration"
    });
  }
  
  if (analysis.hybridSearch.results.some(r => !r.hasFullContent)) {
    recommendations.push({
      issue: "Some results missing full content",
      severity: "medium",
      solution: "Verify SQLite content retrieval mechanism"
    });
  }
  
  return recommendations;
}
