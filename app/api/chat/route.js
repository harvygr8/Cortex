import { NextResponse } from 'next/server';
import { ContextAgent } from '../../../lib/contextAgent';
import ollamaStatus from '../../../lib/utils/ollamaStatus';

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
    const { question, projectId, useKnowledge } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'No active project selected' },
        { status: 400 }
      );
    }

    const agent = await initializeAgent();
    
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start processing in the background
    (async () => {
      try {
        await agent.processProjectQuestion(projectId, question, {
          onProgress: async (chunk) => {
            const payload = JSON.stringify({
              answer: chunk.content,
              widgets: {
                sources: chunk.sources,
                followUpQuestions: chunk.followUpQuestions || [],
                done: chunk.done
              }
            });
            await writer.write(encoder.encode(`data: ${payload}\n\n`));
          }
        }, useKnowledge);
      } catch (error) {
        console.error('[API] Streaming error:', error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 