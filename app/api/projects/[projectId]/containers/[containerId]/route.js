import { NextResponse } from 'next/server';
import projectStore from '../../../../../../lib/projectStore';

export async function GET(request, { params }) {
  try {
    const { containerId } = params;
    const container = await projectStore.getContainer(containerId);
    
    if (!container) {
      return NextResponse.json(
        { error: 'Container not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(container);
  } catch (error) {
    console.error('Error fetching container:', error);
    return NextResponse.json(
      { error: 'Failed to fetch container' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { containerId } = params;
    const body = await request.json();
    
    let updatedContainer = null;
    
    if (body.label !== undefined) {
      updatedContainer = await projectStore.updateContainerLabel(containerId, body.label);
    }
    
    if (body.color !== undefined) {
      updatedContainer = await projectStore.updateContainerColor(containerId, body.color);
    }
    
    if (body.positionX !== undefined && body.positionY !== undefined) {
      updatedContainer = await projectStore.updateContainerPosition(containerId, body.positionX, body.positionY);
    }
    
    if (body.width !== undefined && body.height !== undefined) {
      updatedContainer = await projectStore.updateContainerSize(containerId, body.width, body.height);
    }
    
    if (body.zIndex !== undefined) {
      updatedContainer = await projectStore.updateContainerZIndex(containerId, body.zIndex);
    }
    
    // If no updates were made, get the current container
    if (!updatedContainer) {
      updatedContainer = await projectStore.getContainer(containerId);
    }
    
    return NextResponse.json(updatedContainer);
  } catch (error) {
    console.error('Error updating container:', error);
    return NextResponse.json(
      { error: 'Failed to update container' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { containerId } = params;
    
    await projectStore.deleteContainer(containerId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting container:', error);
    return NextResponse.json(
      { error: 'Failed to delete container' },
      { status: 500 }
    );
  }
}
