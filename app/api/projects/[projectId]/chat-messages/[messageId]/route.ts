import { NextResponse } from 'next/server';
import projectStore from '../../../../../../lib/projectStore';

// GET /api/projects/[projectId]/chat-messages/[messageId]
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const chatMessage = await projectStore.getChatMessage(params.messageId);
    
    if (!chatMessage) {
      return NextResponse.json(
        { error: 'Chat message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error('Error fetching chat message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat message' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId]/chat-messages/[messageId]
export async function PUT(request, { params }) {
  try {
    await projectStore.initialize();
    const { positionX, positionY, sourceHandle, targetHandle, projectId } = await request.json();
    
    if (positionX !== undefined && positionY !== undefined) {
      await projectStore.updateChatMessagePosition(params.messageId, positionX, positionY);
    }
    
    if (sourceHandle !== undefined || targetHandle !== undefined) {
      await projectStore.updateChatMessageHandles(params.messageId, sourceHandle, targetHandle);
    }
    
    if (projectId !== undefined) {
      await projectStore.updateChatMessageProject(params.messageId, projectId);
    }

    const updatedMessage = await projectStore.getChatMessage(params.messageId);
    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to update chat message' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/chat-messages/[messageId]
export async function DELETE(request, { params }) {
  try {
    await projectStore.initialize();
    await projectStore.deleteChatMessage(params.messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat message' },
      { status: 500 }
    );
  }
}
