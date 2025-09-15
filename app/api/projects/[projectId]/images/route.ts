import { NextResponse } from 'next/server';
import projectStore from '../../../../../lib/projectStore';

// GET /api/projects/[projectId]/images
export async function GET(request, { params }) {
  try {
    await projectStore.initialize();
    const images = await projectStore.getImagesByProject(params.projectId);
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/images
export async function POST(request, { params }) {
  try {
    await projectStore.initialize();
    const { imageUrl = '', imageAlt = '', positionX = 0, positionY = 0, sourceHandle = null, targetHandle = null } = await request.json();

    const image = await projectStore.addImage(
      params.projectId,
      imageUrl,
      imageAlt,
      positionX,
      positionY,
      sourceHandle,
      targetHandle
    );

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}
