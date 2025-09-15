import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';

// GET /api/projects/[projectId]/chat-messages
export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    await projectStore.initialize();
    const chatMessages = await projectStore.getChatMessagesByProject(params.projectId);
    return NextResponse.json(chatMessages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
// POST /api/projects/[projectId]/chat-messages
export async function POST(request: NextRequest, { params }: APIRouteParams) {
  try {
    if (!params.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const { query, response, sources = [], positionX = 0, positionY = 0, sourceHandle = null, targetHandle = null } = await request.json();
    
    if (!query || !response) {
      return NextResponse.json(
        { error: 'Query and response are required' },
        { status: 400 }
      );
    }
    const chatMessage = await projectStore.addChatMessage(
      params.projectId,
      query,
      response,
      sources,
      positionX,
      positionY,
      sourceHandle,
      targetHandle
    );
    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
}
