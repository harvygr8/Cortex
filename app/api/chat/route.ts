import { NextRequest, NextResponse } from 'next/server';
import { ContextAgent } from '../../../lib/contextAgent';
import ollamaStatus from '../../../lib/utils/ollamaStatus';
import projectStore from '../../../lib/projectStore';

let contextAgent: ContextAgent | null = null;

const initializeAgent = async (): Promise<ContextAgent> => {
  if (!contextAgent) {
    if (!await ollamaStatus.checkStatus()) {
      await ollamaStatus.start();
    }
    contextAgent = await ContextAgent.initialize();
  }
  return contextAgent;
};

interface ChatRequest {
  question: string;
  projectId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { question, projectId }: ChatRequest = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'No active project selected' },
        { status: 400 }
      );
    }

    console.log('💬 [Chat API] ===== NEW CHAT REQUEST =====');
    console.log(`[Chat API] Question: "${question}"`);
    console.log(`[Chat API] Project ID: ${projectId}`);
    console.log('[Chat API] Initializing context agent with hybrid search...');

    const agent = await initializeAgent();
    console.log('[Chat API] Context agent initialized, processing question with hybrid search...');
    
    const response = await agent.processProjectQuestion(projectId, question);
    
    console.log('✅ [Chat API] Hybrid search processing completed');
    console.log('[Chat API] Raw agent response:', response);
    console.log('[Chat API] Response type:', typeof response);
    console.log('[Chat API] Response structure:', Object.keys(response));

    if (!response || typeof response !== 'object') {
      console.log('[API] Invalid response format detected');
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    const finalResponse = { 
      answer: response.content || response.answer,
      widgets: {
        sources: response.sources || response.widgets?.sources || []
      },
      warning: response.warning || null
    };
    console.log('[API] Final response to frontend:', finalResponse);
    console.log('[API] Sources extracted:', finalResponse.widgets.sources);
    console.log('[API] Response structure breakdown:', {
      hasContent: !!response.content,
      hasAnswer: !!response.answer,
      hasSources: !!response.sources,
      hasWidgetsSources: !!response.widgets?.sources,
      sourcesCount: finalResponse.widgets.sources.length
    });
    
    // Server-side logging of hybrid search details
    console.log('\n🚀 [API] ===== HYBRID SEARCH EXECUTION SUMMARY =====');
    console.log(`[API] Question processed: "${question}"`);
    console.log(`[API] Project ID: ${projectId}`);
    console.log(`[API] Response generated: ${finalResponse.answer ? 'Yes' : 'No'}`);
    console.log(`[API] Sources found: ${finalResponse.widgets.sources.length}`);

    console.log('[API] Hybrid search successfully completed on server side');
    console.log('==================================================\n');
    
    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
} 