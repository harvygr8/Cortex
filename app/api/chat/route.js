import { NextResponse } from 'next/server';
import { ContextAgent } from '../../../lib/contextAgent';
import ollamaStatus from '../../../lib/utils/ollamaStatus';
import projectStore from '../../../lib/projectStore';

let contextAgent;

const initializeAgent = async () => {
  if (!contextAgent) {
    if (!await ollamaStatus.checkStatus()) {
      await ollamaStatus.start();
    }
    contextAgent = await ContextAgent.initialize();
  }
  return contextAgent;
};

export async function POST(request) {
  try {
    const { question, projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'No active project selected' },
        { status: 400 }
      );
    }

    const agent = await initializeAgent();
    const response = await agent.processProjectQuestion(projectId, question);
    console.log('[API] Raw agent response:', response);
    console.log('[API] Response type:', typeof response);
    console.log('[API] Response structure:', Object.keys(response));

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
        sources: response.sources || response.widgets?.sources || [],
        followUpQuestions: response.widgets?.followUpQuestions || []
      }
    };
    console.log('[API] Final response to frontend:', finalResponse);
    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
} 