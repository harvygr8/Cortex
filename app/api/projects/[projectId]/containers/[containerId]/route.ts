import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';

export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    const { containerId } = params;
    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 });
    }
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
export async function PATCH(request: NextRequest, { params }: APIRouteParams) {
  try {
    const { containerId } = params;
    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 });
    }
    const body = await request.json();
    console.log('API: PATCH request for container:', containerId);
    console.log('API: Request body:', body);
    let updatedContainer = null;
    if (body.label !== undefined) {
      console.log('API: Updating container label');
      updatedContainer = await projectStore.updateContainerLabel(containerId, body.label);
    }
    if (body.color !== undefined) {
      console.log('API: Updating container color to:', body.color);
      updatedContainer = await projectStore.updateContainerColor(containerId, body.color);
      console.log('API: Color update result:', updatedContainer);
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

export async function DELETE(request: NextRequest, { params }: APIRouteParams) {
  try {
    const { containerId } = params;
    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 });
    }
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
