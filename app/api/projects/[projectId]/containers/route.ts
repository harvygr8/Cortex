import { NextRequest, NextResponse } from 'next/server';
import type { APIRouteParams } from '@/types';
import projectStore from '@/lib/projectStore';

export async function POST(request: NextRequest, { params }: APIRouteParams) {
  try {
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const body = await request.json();
    
    const {
      label = 'Container',
      color = '#3b82f6',
      positionX = 0,
      positionY = 0,
      width = 300,
      height = 200,
      zIndex = 0
    } = body;
    const container = await projectStore.addContainer(
      projectId,
      label,
      color,
      positionX,
      positionY,
      width,
      height,
      zIndex
    );
    return NextResponse.json(container);
  } catch (error) {
    console.error('Error creating container:', error);
    return NextResponse.json(
      { error: 'Failed to create container' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: APIRouteParams) {
  try {
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const containers = await projectStore.getContainersByProject(projectId);
    return NextResponse.json(containers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch containers' },
      { status: 500 }
    );
  }
}
